import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../../src/App';

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('redirects unauthenticated users to /login', async () => {
    render(<App />);
    const heading = await screen.findByRole('heading', { name: 'Log in' });
    expect(heading).toBeInTheDocument();
  });
});

