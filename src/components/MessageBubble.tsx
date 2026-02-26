import type { Message } from '../types';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  return (
    <div
      className={`${styles.bubble} ${isUser ? styles.user : styles.ai}`}
      data-sender={message.sender}
    >
      <div className={styles.label}>
        {isUser ? 'You' : `AI (${message.model})`}
      </div>
      <div className={styles.content}>{message.content}</div>
      <div className={styles.time}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
