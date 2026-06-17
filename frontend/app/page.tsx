'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipe-card';
import { getRecipes, type Recipe } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 12;

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRecipes({ q: search || undefined, page });
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '레시피를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(query);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">맛있는 레시피를 발견하세요 🍳</h1>
        <p className="text-muted-foreground text-lg">
          셰프들의 특별한 레시피를 탐색하고 나만의 요리를 공유해보세요.
        </p>
        {user && (
          <Button asChild className="mt-2">
            <Link href="/recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              레시피 작성하기
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex max-w-md mx-auto gap-2">
        <Input
          placeholder="레시피 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="레시피 검색"
        />
        <Button type="submit" size="icon" aria-label="검색">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Results header */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {search ? `"${search}" 검색 결과 ${total}개` : `전체 레시피 ${total}개`}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && recipes.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">🥘</p>
          <p className="text-lg font-medium">레시피가 없습니다</p>
          <p className="text-sm mt-1">
            {search ? '검색어를 바꿔보세요.' : '첫 번째 레시피를 작성해보세요!'}
          </p>
        </div>
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </Button>
          <span className="flex items-center px-3 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
