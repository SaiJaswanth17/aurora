'use client';

import { useState, useRef, useEffect } from 'react';
import { useActiveChannel } from '@/stores/chat-store';
import { useChatWebSocket } from '@/lib/websocket/websocket-hooks';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';

import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface MessageInputProps {
  channelId?: string;
  isDm?: boolean;
}

export function MessageInput({ channelId, isDm = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const storeActiveChannelId = useActiveChannel();
  const activeChannelId = channelId || storeActiveChannelId;
  const { sendMessage, sendDirectMessage, startTyping, stopTyping } = useChatWebSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.emoji-picker-container') && !target.closest('.emoji-trigger')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Handle typing indicator
  const handleTyping = (text: string) => {
    setMessage(text);
    adjustHeight();

    if (!isTyping && text.trim() && activeChannelId) {
      setIsTyping(true);
      startTyping(activeChannelId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (activeChannelId) {
        stopTyping(activeChannelId);
      }
      setIsTyping(false);
    }, 3000);
  };

  const handleEmojiClick = (emojiData: any) => {
    const text = message + emojiData.emoji;
    setMessage(text);
    adjustHeight();
    // Keep focus on textarea
    textareaRef.current?.focus();
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
        await handleFileUpload(audioFile);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop but don't save
      mediaRecorderRef.current.onstop = null; // Remove handler
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Refactor file upload to be reusable
  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucketName = 'chat-attachments';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Send message with attachment
      if (activeChannelId) {
        if (isDm) {
          await sendDirectMessage(activeChannelId, '', [publicUrl]);
        } else {
          await sendMessage(activeChannelId, '', [publicUrl]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !activeChannelId || !user) return;

    // Send message
    if (activeChannelId && user) {
      if (isDm) {
        sendDirectMessage(activeChannelId, message.trim());
      } else {
        sendMessage(activeChannelId, message.trim());
      }
    }

    // Clear form
    setMessage('');
    setIsTyping(false);
    setShowEmojiPicker(false);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (activeChannelId) {
      stopTyping(activeChannelId);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Focus back to textarea
    textareaRef.current?.focus();
  };

  // Handle key combinations
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (isTyping && activeChannelId) {
        stopTyping(activeChannelId);
      }
    };
  }, [isTyping, activeChannelId, stopTyping]);

  if (!activeChannelId) {
    return (
      <div className="px-4 py-6 bg-discord-background">
        <div className="px-4 py-3 bg-discord-background-tertiary rounded-lg text-discord-text-muted cursor-not-allowed">
          You do not have permission to send messages in this channel.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-discord-background relative z-10 w-full">
      <div className={`relative flex items-center bg-discord-background-tertiary rounded-lg px-4 py-2.5 w-full ${isRecording ? 'border border-red-500' : ''}`}>

        {isRecording ? (
          /* Recording UI */
          <div className="flex-1 flex items-center justify-between animate-pulse">
            <div className="flex items-center text-red-500 font-bold">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-bounce"></div>
              Recording Audio... {formatDuration(recordingDuration)}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="text-discord-text-muted hover:text-discord-text px-3 py-1 rounded hover:bg-discord-background-secondary text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center"
              >
                <div className="w-2.5 h-2.5 bg-white rounded-sm mr-2"></div>
                Stop & Send
              </button>
            </div>
          </div>
        ) : (
          /* Normal Input UI */
          <>
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`p-2 -ml-2 text-discord-text-muted hover:text-discord-text transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Attach a file"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-discord-text-muted border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
              )}
            </button>

            {/* Text Input */}
            <form onSubmit={handleSubmit} className="flex-1 mx-2 flex">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message"
                className="w-full bg-transparent text-discord-text placeholder-discord-text-muted focus:outline-none resize-none h-6 py-0.5"
                rows={1}
                style={{ maxHeight: '200px' }}
                maxLength={2000}
              />
              <button type="submit" className="hidden" />
            </form>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-3 text-discord-text-muted hover:text-discord-text relative">
              {/* Mic / Voice Message Button */}
              <button
                type="button"
                className="hover:text-discord-text"
                title="Record Voice Message"
                onClick={startRecording}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
              </button>


              {/* Emoji Picker Trigger */}
              <div className="relative">
                <button
                  type="button"
                  className="hover:text-discord-text emoji-trigger"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Send an Emoji"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>
                </button>

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div className="absolute bottom-10 right-0 z-50 emoji-picker-container shadow-2xl rounded-lg">
                    <EmojiPicker
                      theme={'dark' as any}
                      onEmojiClick={handleEmojiClick}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSubmit}
                className={`hover:text-discord-interactive active:text-white transition-colors ${!message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!message.trim()}
                title="Send Message"
              >
                <svg className="w-6 h-6 transform -rotate-45" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
