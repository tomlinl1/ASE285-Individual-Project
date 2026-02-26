export interface ChatRoom {
  id: string;
  title: string;
  participants: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  chatRoomId: string;
  sender: 'user' | 'ai';
  model: string;
  content: string;
  createdAt: string;
}
