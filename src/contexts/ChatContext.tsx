import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ChatRoom, ChatParticipant, Message } from '../types';
import { loadFromStorage, saveChatRooms, saveMessages } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface ChatContextValue {
  chatRooms: ChatRoom[];
  messages: Message[];
  activeRoomId: string | null;
  createRoom: () => Promise<ChatRoom>;
  setActiveRoom: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Promise<Message>;
  appendServerMessage: (message: Message) => void;
  loadMessagesForRoom: (roomId: string) => Promise<void>;
  loadRoomDetail: (roomId: string) => Promise<void>;
  inviteParticipant: (roomId: string, email: string) => Promise<void>;
  getMessagesForRoom: (roomId: string) => Message[];
  refresh: () => Promise<void>;
  importLocalChats?: () => Promise<void>;
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
  const { token } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const api = useMemo(
    () =>
      new ApiClient({
        getToken: () => token,
      }),
    [token]
  );

  const refresh = useCallback(async () => {
    if (!token) {
      const { rooms, messages: msgs } = loadInitial();
      setChatRooms(rooms);
      setMessages(msgs);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const rooms = await api.get<Array<{ id: string; title: string; participants: string[]; createdAt: string }>>(
        '/api/chats'
      );
      setChatRooms(
        rooms.map((r) => ({
          id: r.id,
          title: r.title,
          participants: r.participants,
          createdAt: r.createdAt,
        }))
      );
      // messages are loaded per-room on demand
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistRooms = useCallback((rooms: ChatRoom[]) => {
    saveChatRooms(JSON.stringify(rooms));
  }, []);

  const persistMessages = useCallback((msgs: Message[]) => {
    saveMessages(JSON.stringify(msgs));
  }, []);

  const createRoom = useCallback(async (): Promise<ChatRoom> => {
    if (token) {
      const room = await api.post<{ id: string; title: string; participants: string[]; createdAt: string }>(
        '/api/chats',
        {}
      );
      const nextRoom: ChatRoom = {
        id: room.id,
        title: room.title,
        participants: room.participants,
        createdAt: room.createdAt,
      };
      setChatRooms((prev) => [nextRoom, ...prev]);
      return nextRoom;
    }

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
  }, [api, persistRooms, token]);

  const setActiveRoom = useCallback((id: string | null) => {
    setActiveRoomIdState(id);
  }, []);

  const addMessage = useCallback(
    async (input: Omit<Message, 'id' | 'createdAt'>): Promise<Message> => {
      if (token && input.sender === 'user') {
        const msg = await api.post<{
          id: string;
          chatRoomId: string;
          sender: 'user' | 'ai';
          model: string;
          content: string;
          createdAt: string;
          userId?: string;
          authorEmail?: string;
        }>(`/api/chats/${input.chatRoomId}/messages`, { content: input.content });
        const mapped: Message = { ...msg };
        setMessages((prev) => [...prev, mapped]);
        return mapped;
      }

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
    [api, persistMessages, token]
  );

  const importLocalChats = useCallback(async () => {
    if (!token) return;
    // For Sprint 2: optional migration stub. (Implement later once DB is running)
  }, [token]);

  const appendServerMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const loadMessagesForRoom = useCallback(
    async (roomId: string) => {
      if (!token) return;
      const list = await api.get<
        Array<{
          id: string;
          chatRoomId: string;
          sender: 'user' | 'ai';
          model: string;
          content: string;
          createdAt: string;
          userId?: string;
          authorEmail?: string;
        }>
      >(`/api/chats/${roomId}/messages`);
      setMessages((prev) => {
        const rest = prev.filter((m) => m.chatRoomId !== roomId);
        return [...rest, ...list];
      });
    },
    [api, token]
  );

  const loadRoomDetail = useCallback(
    async (roomId: string) => {
      if (!token) return;
      const detail = await api.get<{
        id: string;
        title: string;
        participants: string[];
        members: ChatParticipant[];
        createdAt: string;
        updatedAt: string;
      }>(`/api/chats/${roomId}/detail`);
      setChatRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                title: detail.title,
                participants: detail.participants,
                members: detail.members,
              }
            : r
        )
      );
    },
    [api, token]
  );

  const inviteParticipant = useCallback(
    async (roomId: string, email: string) => {
      if (!token) return;
      const detail = await api.post<{
        id: string;
        title: string;
        participants: string[];
        members: ChatParticipant[];
        createdAt: string;
        updatedAt: string;
      }>(`/api/chats/${roomId}/participants`, { email });
      setChatRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                title: detail.title,
                participants: detail.participants,
                members: detail.members,
              }
            : r
        )
      );
    },
    [api, token]
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
      appendServerMessage,
      loadMessagesForRoom,
      loadRoomDetail,
      inviteParticipant,
      getMessagesForRoom,
      refresh,
      importLocalChats,
      isLoading,
    }),
    [
      chatRooms,
      messages,
      activeRoomId,
      createRoom,
      setActiveRoom,
      addMessage,
      appendServerMessage,
      loadMessagesForRoom,
      loadRoomDetail,
      inviteParticipant,
      getMessagesForRoom,
      refresh,
      importLocalChats,
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
