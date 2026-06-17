'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, LogOut, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <ChefHat className="h-6 w-6 text-primary" />
          CookShare
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
              <Button asChild size="sm">
                <Link href="/recipes/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  레시피 작성
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">회원가입</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
