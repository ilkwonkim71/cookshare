import { render, screen } from '@testing-library/react';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('UI primitives', () => {
  it('Input forwards props', () => {
    render(<Input placeholder="이메일" />);
    expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument();
  });

  it('Label renders its text', () => {
    render(<Label>이름</Label>);
    expect(screen.getByText('이름')).toBeInTheDocument();
  });

  it('Textarea forwards props', () => {
    render(<Textarea placeholder="설명" />);
    expect(screen.getByPlaceholderText('설명')).toBeInTheDocument();
  });

  it('Card composes its parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>제목</CardTitle>
        </CardHeader>
        <CardContent>본문</CardContent>
      </Card>,
    );
    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
  });
});
