import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Recipe } from '@/lib/api';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        {recipe.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        {!recipe.imageUrl && (
          <div className="flex h-48 w-full items-center justify-center bg-muted text-4xl">🍳</div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1 text-lg">{recipe.title}</CardTitle>
          <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {recipe.cookTime != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {recipe.cookTime}분
              </span>
            )}
            {recipe.servings != null && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings}인분
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">by {recipe.author.name}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
