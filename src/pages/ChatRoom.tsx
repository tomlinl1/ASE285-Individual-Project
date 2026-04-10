import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useAI } from '../hooks/useAI';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import styles from './ChatRoom.module.css';

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const {
    chatRooms,
    addMessage,
    appendServerMessage,
    getMessagesForRoom,
    setActiveRoom,
    loadMessagesForRoom,
    loadRoomDetail,
    inviteParticipant,
  } = useChat();
  const { sendMessage, isLoading, error } = useAI(appendServerMessage, api);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const room = chatRooms.find((r) => r.id === id);
  const messages = id ? getMessagesForRoom(id) : [];

  useEffect(() => {
    if (!id || !user) return;
    void loadMessagesForRoom(id);
    void loadRoomDetail(id);
  }, [id, user, loadMessagesForRoom, loadRoomDetail]);

  const handleSend = async (text: string) => {
    if (!id) return;
    await addMessage({
      chatRoomId: id,
      sender: 'user',
      model: '',
      content: text,
    });
    sendMessage(id);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    setInviteError(null);
    setInviteBusy(true);
    try {
      await inviteParticipant(id, inviteEmail.trim());
      setInviteEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviteBusy(false);
    }
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

  const handleExportMd = async () => {
    try {
      const text = await api.getText(`/api/chats/${room.id}/export?format=md`);
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${room.title.replace(/[^\w\s-]/g, '').trim().slice(0, 40) || 'chat'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // non-fatal; user can retry
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          Back
        </button>
        <h1 className={styles.title}>{room.title}</h1>
        <div className={styles.headerLinks}>
          <Link to="/prompts" className={styles.exportLink}>
            Prompts
          </Link>
          <button type="button" className={styles.exportButton} onClick={handleExportMd}>
            Export (md)
          </button>
        </div>
      </header>

      <section className={styles.studyGroup} aria-label="Study group">
        <h2 className={styles.studyGroupTitle}>Study together</h2>
        <p className={styles.studyGroupHint}>
          Invite others by email. They need an account on this app first.
        </p>
        <ul className={styles.memberList}>
          {room.members && room.members.length > 0 ? (
            room.members.map((m) => (
              <li key={m.id} className={styles.memberItem}>
                {m.email}
              </li>
            ))
          ) : (
            <li className={styles.memberItemMuted}>
              {room.participants.length} member{room.participants.length === 1 ? '' : 's'}
              {room.members === undefined ? ' (loading…)' : ''}
            </li>
          )}
        </ul>
        <form className={styles.inviteForm} onSubmit={handleInvite}>
          <input
            type="email"
            className={styles.inviteInput}
            placeholder="Classmate's email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={inviteBusy}
            autoComplete="email"
          />
          <button type="submit" className={styles.inviteButton} disabled={inviteBusy || !inviteEmail.trim()}>
            {inviteBusy ? 'Inviting…' : 'Invite'}
          </button>
        </form>
        {inviteError && <div className={styles.inviteError}>{inviteError}</div>}
      </section>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>Send a message to start the conversation.</div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={user?.id} />
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
