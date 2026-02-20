'use client';

import { Message } from '@aurora/shared';
import { formatMessageTimestamp } from '@/lib/auth/auth-utils';
import { CustomAudioPlayer } from '../ui/custom-audio-player';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage?: boolean;
}

export function MessageBubble({ message, isOwnMessage: isOwn }: MessageBubbleProps) {
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex w-full my-2 justify-center">
        <div className="flex items-center text-discord-text-muted text-xs">
          <span className="font-bold mr-1">{message.author?.username || 'System'}</span>
          <span>{message.content}</span>
          <span className="ml-1 text-[10px] text-discord-text-muted/70">{formatMessageTimestamp(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full py-2 px-4 hover:bg-discord-background-modifier-hover group transition-colors ${isOwn ? '' : ''}`}>
      {/* Avatar - only show if not same author as prev message (simplified for now, always show) */}
      <div className="mt-0.5 w-10 h-10 rounded-full bg-discord-accent flex-shrink-0 flex items-center justify-center overflow-hidden mr-4 cursor-pointer hover:opacity-80 transition-opacity">
        {message.author?.avatarUrl ? (
          <img src={message.author.avatarUrl} alt={message.author.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">{message.author?.username?.replace(/[^a-zA-Z0-9]/g, '')?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          <span className="font-semibold text-discord-text mr-2 hover:underline cursor-pointer text-[15px]">
            {message.author?.username || 'Unknown User'}
          </span>
          <span className="text-[11px] text-discord-text-muted">
            {formatMessageTimestamp(message.createdAt)}
          </span>
        </div>

        {message.content && (
          <div className="text-[15px] text-discord-text leading-[1.375rem] whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* Attachments */}
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((attachment, index) => {
              const url = typeof attachment === 'string' ? attachment : attachment.url;
              if (!url) return null;
              const extension = url.split('.').pop()?.toLowerCase() || '';

              console.log(`Checking attachment: type=${typeof attachment}, url=${url}, ext=${extension}`);
              // Check for voice messages specifically (saved as webm but should be audio)
              const filename = typeof attachment === 'string' ? '' : attachment.filename || '';
              const contentType = typeof attachment === 'string' ? '' : attachment.contentType || '';
              const isVoiceMessage = url.includes('voice_message') || filename.includes('voice_message') || contentType.startsWith('audio/');
              console.log(`isVoiceMessage=${isVoiceMessage}`);

              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
              const isVideo = !isVoiceMessage && ['mp4', 'webm', 'mov', 'quicktime'].includes(extension);
              const isAudio = isVoiceMessage || ['mp3', 'wav', 'ogg'].includes(extension);

              if (isImage) {
                return (
                  <div key={index} className="relative max-w-[400px] rounded-lg overflow-hidden border border-discord-background-secondary bg-discord-background-secondary">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block cursor-zoom-in">
                      <img src={url} alt={attachment.filename || 'Image'} className="max-w-full h-auto object-contain max-h-[300px]" />
                    </a>
                  </div>
                );
              }

              if (isVideo) {
                return (
                  <div key={index} className="relative max-w-[400px] rounded-lg overflow-hidden border border-discord-background-secondary bg-discord-background-secondary">
                    <video controls src={url} className="max-w-full h-auto max-h-[300px]" />
                  </div>
                );
              }

              if (isAudio) {
                return (
                  <CustomAudioPlayer key={index} src={url} />
                );
              }

              // Generic File
              return (
                <div key={index} className="flex items-center p-3 bg-discord-background-secondary border border-discord-background-tertiary rounded-md max-w-[400px]">
                  <div className="mr-3 text-discord-text">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-discord-interactive hover:underline font-medium text-sm truncate block">
                      {attachment.filename || url.split('/').pop()}
                    </a>
                    <div className="text-xs text-discord-text-muted">
                      {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'File'}
                    </div>
                  </div>
                  <a href={url} download target="_blank" rel="noopener noreferrer" className="ml-2 text-discord-text-muted hover:text-discord-text">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
