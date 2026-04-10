import { useNavigate, Link } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatList.module.css';

export function ChatList() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { chatRooms, createRoom, setActiveRoom, getMessagesForRoom, isLoading, refresh } = useChat();

  const handleNewChat = async () => {
    const room = await createRoom();
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
        <div>
          <h1>AI Study Hub</h1>
          {user && <div className={styles.subTitle}>Signed in as {user.email}</div>}
        </div>
        <div className={styles.headerActions}>
          <Link to="/prompts" className={styles.navLink}>
            Prompt library
          </Link>
          <button type="button" className={styles.secondaryButton} onClick={() => refresh()}>
            Refresh
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
          <button type="button" className={styles.newButton} onClick={handleNewChat}>
            New chat
          </button>
        </div>
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
                <span className={styles.titleBlock}>
                  <span className={styles.title}>{room.title}</span>
                  <span className={styles.meta}>
                    {room.participants.length} member{room.participants.length === 1 ? '' : 's'}
                  </span>
                </span>
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
