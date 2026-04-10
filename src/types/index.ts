export interface ChatParticipant {
  id: string;
  email: string;
}

export interface ChatRoom {
  id: string;
  title: string;
  participants: string[];
  /** Populated when room detail is loaded (group chat UI). */
  members?: ChatParticipant[];
  createdAt: string;
}

export interface Message {
  id: string;
  chatRoomId: string;
  sender: 'user' | 'ai';
  model: string;
  content: string;
  createdAt: string;
  /** Set for user messages in API mode (group chats). */
  userId?: string;
  authorEmail?: string;
}
