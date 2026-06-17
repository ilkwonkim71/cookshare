'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecipe, deleteRecipe, type Recipe } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    getRecipe(params.id)
      .then(({ recipe }) => setRecipe(recipe))
      .catch((err) =>
        setError(err instanceof Error ? err.message : '레시피를 불러오지 못했습니다.'),
      )
      .finally(() => setIsLoading(false));
  }, [params.id]);

  async function handleDelete() {
    if (!recipe) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast({ title: '삭제 완료', description: '레시피가 삭제되었습니다.' });
      router.push('/');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: err instanceof Error ? err.message : '다시 시도해주세요.',
      });
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-10 w-3/4 bg-muted rounded" />
        <div className="h-72 bg-muted rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-destructive text-lg">{error ?? '레시피를 찾을 수 없습니다.'}</p>
        <Button asChild variant="outline">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === recipe.author.id;

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ChevronLeft className="mr-1 h-4 w-4" />
          목록으로
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold leading-tight">{recipe.title}</h1>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="레시피 삭제"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>by {recipe.author.name}</span>
          {recipe.cookTime != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              조리 {recipe.cookTime}분
            </span>
          )}
          {recipe.servings != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings}인분
            </span>
          )}
          <span>{new Date(recipe.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>

        <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
      </div>

      {/* Image */}
      {recipe.imageUrl && (
        <div className="relative h-80 w-full overflow-hidden rounded-xl">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Ingredients */}
      <section>
        <h2 className="text-xl font-semibold mb-4">재료</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {ingredient}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section>
        <h2 className="text-xl font-semibold mb-4">조리 단계</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
