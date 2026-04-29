import { describe, expect, it, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocalStorage } from '../../../src/hooks/useLocalStorage';

function Harness({ storageKey }: { storageKey: string }) {
  const [value, setValue] = useLocalStorage<string>(storageKey, 'init');
  return (
    <div>
      <div data-testid="value">{value}</div>
      <button type="button" onClick={() => setValue('next')}>
        set
      </button>
      <button type="button" onClick={() => setValue((prev) => `${prev}!`)}>
        bang
      </button>
    </div>
  );
}

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses initialValue when key missing', () => {
    render(<Harness storageKey="k1" />);
    expect(screen.getByTestId('value')).toHaveTextContent('init');
  });

  it('recovers from invalid JSON by using initialValue', () => {
    localStorage.setItem('k2', '{not json');
    render(<Harness storageKey="k2" />);
    expect(screen.getByTestId('value')).toHaveTextContent('init');
  });

  it('writes updates to localStorage (value and functional form)', async () => {
    const user = userEvent.setup();
    render(<Harness storageKey="k3" />);

    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(screen.getByTestId('value')).toHaveTextContent('next');
    expect(localStorage.getItem('k3')).toBe(JSON.stringify('next'));

    await user.click(screen.getByRole('button', { name: 'bang' }));
    expect(screen.getByTestId('value')).toHaveTextContent('next!');
    expect(localStorage.getItem('k3')).toBe(JSON.stringify('next!'));
  });
});

