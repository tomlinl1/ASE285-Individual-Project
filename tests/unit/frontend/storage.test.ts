import { beforeEach, describe, expect, it } from 'vitest';
import { loadFromStorage, saveChatRooms, saveMessages } from '../../../src/services/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads defaults when keys are missing', () => {
    expect(loadFromStorage()).toEqual({ chatRooms: '[]', messages: '[]' });
  });

  it('saves and loads chat rooms/messages JSON', () => {
    saveChatRooms('[{"id":"1"}]');
    saveMessages('[{"id":"m1"}]');

    const loaded = loadFromStorage();
    expect(loaded.chatRooms).toBe('[{"id":"1"}]');
    expect(loaded.messages).toBe('[{"id":"m1"}]');
  });
});

