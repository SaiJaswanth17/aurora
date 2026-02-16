
import React, { useEffect, useRef } from 'react';
import { CallState } from '../../hooks/use-webrtc';

interface CallOverlayProps {
    callState: CallState;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    targetUser: { id: string; name: string; avatar?: string } | null;
    onEndCall: () => void;
    onAcceptCall: () => void;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
}

export function CallOverlay({
    callState,
    localStream,
    remoteStream,
    targetUser,
    onEndCall,
    onAcceptCall,
    isAudioEnabled,
    isVideoEnabled,
    onToggleAudio,
    onToggleVideo
}: CallOverlayProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (callState === 'idle') return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                            {targetUser?.avatar ? (
                                <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold">{targetUser?.name?.[0]}</div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{targetUser?.name}</h3>
                            <p className="text-sm text-gray-300">
                                {callState === 'calling' ? 'Calling...' :
                                    callState === 'incoming' ? 'Incoming Call...' :
                                        callState === 'connected' ? 'Connected' : 'Ending...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Area */}
                <div className="flex-1 relative bg-black flex items-center justify-center">
                    {/* Remote Video (Main) */}
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-white text-xl">
                            {callState === 'connected' ? 'Waiting for video...' : ''}
                        </div>
                    )}

                    {/* Local Video (PiP) */}
                    {localStream && (
                        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-6">

                    {callState === 'incoming' ? (
                        <>
                            <button
                                onClick={onEndCall}
                                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" /></svg>
                            </button>
                            <button
                                onClick={onAcceptCall}
                                className="p-4 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.26-.27.36-.66.25-1.01-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3.3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" /></svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onToggleAudio}
                                className={`p-4 rounded-full transition-colors ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}
                            >
                                {/* Toggle Icon */}
                                {isAudioEnabled ? 'Mic On' : 'Mic Off'}
                            </button>

                            <button
                                onClick={onEndCall}
                                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" /></svg>
                            </button>

                            <button
                                onClick={onToggleVideo}
                                className={`p-4 rounded-full transition-colors ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}
                            >
                                {isVideoEnabled ? 'Cam On' : 'Cam Off'}
                            </button>
                        </>
                    )}

                </div>

            </div>
        </div>
    );
}
