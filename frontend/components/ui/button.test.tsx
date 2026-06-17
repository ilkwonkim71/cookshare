import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Button disabled>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('applies the variant class', () => {
    render(<Button variant="destructive">삭제</Button>);
    expect(screen.getByRole('button', { name: '삭제' }).className).toContain('destructive');
  });
});
