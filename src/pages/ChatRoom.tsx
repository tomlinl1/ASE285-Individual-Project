import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useAI } from '../hooks/useAI';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import styles from './ChatRoom.module.css';

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    chatRooms,
    addMessage,
    getMessagesForRoom,
    setActiveRoom,
  } = useChat();
  const { sendMessage, isLoading, error } = useAI(addMessage, getMessagesForRoom);

  const room = chatRooms.find((r) => r.id === id);
  const messages = id ? getMessagesForRoom(id) : [];

  const handleSend = (text: string) => {
    if (!id) return;
    addMessage({
      chatRoomId: id,
      sender: 'user',
      model: '',
      content: text,
    });
    sendMessage(id, text);
  };

  const handleBack = () => {
    setActiveRoom(null);
    navigate('/');
  };

  if (!id) {
    return (
      <div className={styles.wrapper}>
        <p>Missing chat id.</p>
        <button type="button" onClick={() => navigate('/')}>Back to chats</button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={styles.wrapper}>
        <p>Chat not found.</p>
        <button type="button" onClick={() => navigate('/')}>Back to chats</button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          Back
        </button>
        <h1 className={styles.title}>{room.title}</h1>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>Send a message to start the conversation.</div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className={styles.typing}>AI is typing…</div>
        )}
        {error && (
          <div className={styles.error}>{error}</div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
