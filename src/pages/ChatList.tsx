import { useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import styles from './ChatList.module.css';

export function ChatList() {
  const navigate = useNavigate();
  const { chatRooms, createRoom, setActiveRoom, getMessagesForRoom, isLoading } = useChat();

  const handleNewChat = () => {
    const room = createRoom();
    setActiveRoom(room.id);
    navigate(`/chat/${room.id}`);
  };

  const handleOpen = (id: string) => {
    setActiveRoom(id);
    navigate(`/chat/${id}`);
  };

  const lastActivity = (roomId: string) => {
    const messages = getMessagesForRoom(roomId);
    if (messages.length === 0) return null;
    return messages[messages.length - 1].createdAt;
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>AI Study Hub</h1>
        <button type="button" className={styles.newButton} onClick={handleNewChat}>
          New chat
        </button>
      </header>
      <ul className={styles.list}>
        {chatRooms.length === 0 ? (
          <li className={styles.empty}>No chats yet. Start a new chat.</li>
        ) : (
          chatRooms.map((room) => (
            <li key={room.id} className={styles.item}>
              <button
                type="button"
                className={styles.roomButton}
                onClick={() => handleOpen(room.id)}
              >
                <span className={styles.title}>{room.title}</span>
                {lastActivity(room.id) && (
                  <span className={styles.time}>
                    {new Date(lastActivity(room.id)!).toLocaleDateString()}
                  </span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
