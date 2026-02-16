
import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from '../lib/websocket/websocket-context';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
};

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

export function useWebRTC() {
    const { send, on } = useWebSocket();

    const [callState, setCallState] = useState<CallState>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [targetUser, setTargetUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);

    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    // Pending offer for incoming calls
    const [pendingOffer, setPendingOffer] = useState<any>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);



    const startLocalStream = useCallback(async (video: boolean = true, audio: boolean = true) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not access Camera/Microphone');
            return null;
        }
    }, []);

    const initiateCall = useCallback(async (userId: string, userName: string, avatar?: string, video: boolean = true) => {
        setTargetUser({ id: userId, name: userName, avatar });
        setCallState('calling');
        setIsVideoEnabled(video);
        setIsAudioEnabled(true);

        const stream = await startLocalStream(video, true);
        if (!stream) {
            setCallState('idle');
            return;
        }

        // We need to wait for state update of targetUser to be reflected in createPeerConnection dependency?
        // Actually createPeerConnection uses targetUser from state, which is stale here close over.
        // We should pass targetUser to createPeerConnection or use ref.
        // Let's rely on the fact that we set it, but for the callback inside onicecandidate it needs the ref or the updated state.
        // Since we can't wait for render, let's just make sure onicecandidate accesses the current targetUser via a Ref or passed arg.
        // Simplified: createPeerConnection doesn't need to know targetUser at creation time BUT the callback does.

        // Quick fix: Update a ref for targetUser so callbacks see it immediately.
        // But for now, let's just proceed. The candidate might fail if targetUser is null in closure.
        // See useEffect below for syncing.

        const pc = new RTCPeerConnection(STUN_SERVERS);
        peerConnectionRef.current = pc;

        // Re-implement handlers here to close over current scope variables if needed, 
        // or use a ref for targetUser.

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                send('call:signal', {
                    type: 'candidate',
                    targetUserId: userId, // Use local var
                    data: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        send('call:signal', {
            type: 'offer',
            targetUserId: userId,
            data: offer
        });
    }, [send, startLocalStream]);

    const acceptCall = useCallback(async () => {
        if (!pendingOffer || !targetUser) return;

        setCallState('connected');
        const stream = await startLocalStream(true, true);
        if (!stream) return;

        const pc = new RTCPeerConnection(STUN_SERVERS);
        peerConnectionRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                send('call:signal', {
                    type: 'candidate',
                    targetUserId: targetUser.id,
                    data: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        send('call:signal', {
            type: 'answer',
            targetUserId: targetUser.id,
            data: answer,
        });
    }, [pendingOffer, targetUser, send, startLocalStream]);

    const endCall = useCallback(() => {
        if (targetUser && (callState === 'connected' || callState === 'calling' || callState === 'incoming')) {
            send('call:signal', {
                type: 'end',
                targetUserId: targetUser.id
            });
        }

        cleanupCall();
    }, [targetUser, callState, send]);

    const cleanupCall = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);
        setTargetUser(null);
        setCallState('idle');
        setPendingOffer(null);
    }, []);

    // Handle Incoming Signals
    useEffect(() => {
        const handleSignal = async (payload: any) => {
            const { type: signalType, senderId, senderName, senderAvatar, data } = payload;
            console.log('WebRTC Signal:', signalType);

            switch (signalType) {
                case 'call:offer':
                    // Only accept if idle
                    if (callState === 'idle') {
                        setTargetUser({ id: senderId, name: senderName, avatar: senderAvatar });
                        setPendingOffer(data);
                        setCallState('incoming');
                    } else {
                        // Busy
                        send('call:signal', { type: 'reject', targetUserId: senderId });
                    }
                    break;

                case 'call:answer':
                    if (callState === 'calling' && peerConnectionRef.current) {
                        setCallState('connected');
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
                    }
                    break;

                case 'call:candidate':
                    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                        try {
                            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data));
                        } catch (e) {
                            console.error("Error adding Ice Candidate", e);
                        }
                    }
                    break;

                case 'call:end':
                case 'call:reject':
                    cleanupCall();
                    break;
            }
        };

        // Listen to 'call:signal' event from server
        // Note: server wraps forwarded signals in 'call:signal' type? 
        // Checking CallHandler: 
        // const signalMsg = { type: `call:${type}`, payload: { ... } };
        // connectionManager.sendToConnection(connId, signalMsg);
        // So the EVENT is 'call:offer', 'call:answer', etc. NOT 'call:signal'.

        // I need to subscribe to all of them.
        const unsubOffer = on('call:offer', (p) => handleSignal({ ...(p as object), type: 'call:offer' }));
        const unsubAnswer = on('call:answer', (p) => handleSignal({ ...(p as object), type: 'call:answer' }));
        const unsubCandidate = on('call:candidate', (p) => handleSignal({ ...(p as object), type: 'call:candidate' }));
        const unsubEnd = on('call:end', (p) => handleSignal({ ...(p as object), type: 'call:end' }));
        const unsubReject = on('call:reject', (p) => handleSignal({ ...(p as object), type: 'call:reject' }));

        return () => {
            unsubOffer();
            unsubAnswer();
            unsubCandidate();
            unsubEnd();
            unsubReject();
        };
    }, [on, callState, cleanupCall, send]);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isAudioEnabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    }, [isAudioEnabled]);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !isVideoEnabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    }, [isVideoEnabled]);

    return {
        callState,
        localStream,
        remoteStream,
        targetUser,
        isAudioEnabled,
        isVideoEnabled,
        initiateCall,
        acceptCall,
        endCall,
        toggleAudio,
        toggleVideo
    };
}
