
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { CallOverlay } from '@/components/call/call-overlay';

interface CallContextType {
    initiateCall: (userId: string, userName: string, avatar?: string, video?: boolean) => Promise<void>;
    isInCall: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
    const {
        callState,
        localStream,
        remoteStream,
        targetUser,
        initiateCall,
        acceptCall,
        endCall,
        isAudioEnabled,
        isVideoEnabled,
        toggleAudio,
        toggleVideo
    } = useWebRTC();

    const handleInitiateCall = async (userId: string, userName: string, avatar?: string, video: boolean = true) => {
        await initiateCall(userId, userName, avatar, video);
    };

    return (
        <CallContext.Provider
            value={{
                initiateCall: handleInitiateCall,
                isInCall: callState !== 'idle'
            }}
        >
            {children}

            {(callState !== 'idle') && (
                <CallOverlay
                    callState={callState}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    targetUser={targetUser}
                    onEndCall={endCall}
                    onAcceptCall={acceptCall}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                />
            )}
        </CallContext.Provider>
    );
}

export function useCall() {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
}
