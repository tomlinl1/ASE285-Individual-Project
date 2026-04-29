import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';

function Harness() {
  const { token, user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="token">{token ?? ''}</div>
      <div data-testid="email">{user?.email ?? ''}</div>
      <button type="button" onClick={() => login('t', { id: 'u1', email: 'a@b.com' })}>
        login
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists token/user on login and clears on logout', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: 'login' }));
    expect(screen.getByTestId('token')).toHaveTextContent('t');
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.com');
    expect(localStorage.getItem('ai-study-hub-token')).toBe('t');
    expect(localStorage.getItem('ai-study-hub-user')).toBe(JSON.stringify({ id: 'u1', email: 'a@b.com' }));

    await user.click(screen.getByRole('button', { name: 'logout' }));
    expect(screen.getByTestId('token')).toHaveTextContent('');
    expect(screen.getByTestId('email')).toHaveTextContent('');
    expect(localStorage.getItem('ai-study-hub-token')).toBeNull();
    expect(localStorage.getItem('ai-study-hub-user')).toBeNull();
  });
});

