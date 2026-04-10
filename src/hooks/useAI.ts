import { useState, useCallback } from 'react';
import { ApiClient } from '../services/apiClient';
import type { Message } from '../types';

export function useAI(
  appendServerMessage: (msg: Message) => void,
  api: ApiClient
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (chatRoomId: string) => {
      setError(null);
      setIsLoading(true);

      try {
        const msg = await api.post<{
          id: string;
          chatRoomId: string;
          sender: 'user' | 'ai';
          model: string;
          content: string;
          createdAt: string;
        }>(`/api/chats/${chatRoomId}/ai-reply`, {});

        appendServerMessage({
          id: msg.id,
          chatRoomId: msg.chatRoomId,
          sender: msg.sender,
          model: msg.model,
          content: msg.content,
          createdAt: msg.createdAt,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to get AI response';
        setError(message);
        appendServerMessage({
          id: crypto.randomUUID(),
          chatRoomId,
          sender: 'ai',
          model: '',
          content: `Error: ${message}`,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [appendServerMessage, api]
  );

  return { sendMessage, isLoading, error };
}
