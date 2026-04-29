import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
  currentUserId?: string | null;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSelf =
    isUser && message.userId && currentUserId ? message.userId === currentUserId : false;

  let userLabel = 'You';
  if (isUser) {
    if (isSelf || (!message.userId && !message.authorEmail)) {
      userLabel = 'You';
    } else if (message.authorEmail) {
      userLabel = message.authorEmail;
    } else {
      userLabel = 'Study partner';
    }
  }

  return (
    <div
      className={`${styles.bubble} ${isUser ? styles.user : styles.ai}`}
      data-sender={message.sender}
    >
      <div className={styles.label}>
        {isUser ? userLabel : `AI (${message.model || 'model'})`}
      </div>
      <div className={isUser ? styles.content : `${styles.content} ${styles.mdRoot}`}>
        {isUser ? (
          <span className={styles.plain}>{message.content}</span>
        ) : (
          <div className={styles.md}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      <div className={styles.time}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
