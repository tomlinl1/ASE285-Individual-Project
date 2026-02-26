const CHAT_ROOMS_KEY = 'ai-study-hub-chat-rooms';
const MESSAGES_KEY = 'ai-study-hub-messages';

export interface StoredData {
  chatRooms: string;
  messages: string;
}

export function loadFromStorage(): StoredData {
  return {
    chatRooms: localStorage.getItem(CHAT_ROOMS_KEY) ?? '[]',
    messages: localStorage.getItem(MESSAGES_KEY) ?? '[]',
  };
}

export function saveChatRooms(json: string): void {
  localStorage.setItem(CHAT_ROOMS_KEY, json);
}

export function saveMessages(json: string): void {
  localStorage.setItem(MESSAGES_KEY, json);
}
