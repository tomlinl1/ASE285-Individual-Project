import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ChatRoom, Message } from '../types';
import { loadFromStorage, saveChatRooms, saveMessages } from '../services/storage';

interface ChatContextValue {
  chatRooms: ChatRoom[];
  messages: Message[];
  activeRoomId: string | null;
  createRoom: () => ChatRoom;
  setActiveRoom: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Message;
  getMessagesForRoom: (roomId: string) => Message[];
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function uuid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function loadInitial(): { rooms: ChatRoom[]; messages: Message[] } {
  const { chatRooms: roomsRaw, messages: messagesRaw } = loadFromStorage();
  try {
    return {
      rooms: roomsRaw ? (JSON.parse(roomsRaw) as ChatRoom[]) : [],
      messages: messagesRaw ? (JSON.parse(messagesRaw) as Message[]) : [],
    };
  } catch {
    return { rooms: [], messages: [] };
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { rooms, messages: msgs } = loadInitial();
    setChatRooms(rooms);
    setMessages(msgs);
    setIsLoading(false);
  }, []);

  const persistRooms = useCallback((rooms: ChatRoom[]) => {
    saveChatRooms(JSON.stringify(rooms));
  }, []);

  const persistMessages = useCallback((msgs: Message[]) => {
    saveMessages(JSON.stringify(msgs));
  }, []);

  const createRoom = useCallback((): ChatRoom => {
    const room: ChatRoom = {
      id: uuid(),
      title: 'New chat',
      participants: [],
      createdAt: now(),
    };
    setChatRooms((prev) => {
      const next = [room, ...prev];
      persistRooms(next);
      return next;
    });
    return room;
  }, [persistRooms]);

  const setActiveRoom = useCallback((id: string | null) => {
    setActiveRoomIdState(id);
  }, []);

  const addMessage = useCallback(
    (input: Omit<Message, 'id' | 'createdAt'>): Message => {
      const message: Message = {
        ...input,
        id: uuid(),
        createdAt: now(),
      };
      setMessages((prev) => {
        const next = [...prev, message];
        persistMessages(next);
        return next;
      });
      return message;
    },
    [persistMessages]
  );

  const getMessagesForRoom = useCallback(
    (roomId: string) =>
      messages.filter((m) => m.chatRoomId === roomId).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      chatRooms,
      messages,
      activeRoomId,
      createRoom,
      setActiveRoom,
      addMessage,
      getMessagesForRoom,
      isLoading,
    }),
    [
      chatRooms,
      messages,
      activeRoomId,
      createRoom,
      setActiveRoom,
      addMessage,
      getMessagesForRoom,
      isLoading,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
