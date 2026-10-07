import { useEffect, useRef } from 'react';
import type { TFunction } from '../i18n';
import type { Message } from '../types';

interface Props {
  chatId: string;
  messages: Message[];
  t: TFunction;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusMark({ message, t }: { message: Message; t: TFunction }) {
  if (message.author !== 'me') return null;
  if (message.status === 'sending') return <span className="msg-status">·</span>;
  if (message.status === 'failed') return <span className="msg-status failed">{t('msg.failed')}</span>;
  return <span className="msg-status">✓</span>;
}

export default function MessageList({ chatId, messages, t }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [chatId, messages]);

  const visible = messages.filter((message) => message.chatId === chatId);

  return (
    <div className="messages">
      {visible.length === 0 && <div className="messages-empty">{t('msg.empty')}</div>}
      {visible.map((message) => (
        <div key={message.id} className={`msg-row ${message.author}`}>
          <div className={`bubble${message.status === 'failed' ? ' failed' : ''}`}>
            <div className="bubble-text">{message.text}</div>
            <div className="bubble-meta">
              <span>{formatTime(message.timestamp)}</span>
              <StatusMark message={message} t={t} />
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
