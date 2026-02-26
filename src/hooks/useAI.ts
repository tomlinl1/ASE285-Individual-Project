import { useState, useCallback } from 'react';
import { sendToGemini, type ChatTurn } from '../services/aiApi';
import type { Message } from '../types';

const AI_MODEL = 'gemini-1.5-flash';

function messagesToTurns(messages: Message[]): ChatTurn[] {
  return messages.map((m) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    content: m.content,
  }));
}

export function useAI(
  addMessage: (input: Omit<Message, 'id' | 'createdAt'>) => Message,
  getMessagesForRoom: (roomId: string) => Message[]
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (chatRoomId: string, userContent: string) => {
      setError(null);
      setIsLoading(true);
      const history = getMessagesForRoom(chatRoomId);
      const turns: ChatTurn[] = [
        ...messagesToTurns(history),
        { role: 'user', content: userContent },
      ];

      try {
        const reply = await sendToGemini({
          messages: turns,
          model: AI_MODEL,
        });
        addMessage({
          chatRoomId,
          sender: 'ai',
          model: AI_MODEL,
          content: reply,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to get AI response';
        setError(message);
        addMessage({
          chatRoomId,
          sender: 'ai',
          model: AI_MODEL,
          content: `Error: ${message}`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, getMessagesForRoom]
  );

  return { sendMessage, isLoading, error };
}
