'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlusCircle, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createRecipe, uploadImage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export default function NewRecipePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ variant: 'destructive', title: '로그인이 필요합니다.' });
      router.push('/login');
    }
  }, [user, authLoading, router]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // --- Ingredients helpers ---
  function updateIngredient(idx: number, val: string) {
    setIngredients((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }
  function addIngredient() {
    setIngredients((prev) => [...prev, '']);
  }
  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  // --- Steps helpers ---
  function updateStep(idx: number, val: string) {
    setSteps((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }
  function addStep() {
    setSteps((prev) => [...prev, '']);
  }
  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const filteredIngredients = ingredients.filter((s) => s.trim());
    const filteredSteps = steps.filter((s) => s.trim());

    if (!title.trim()) {
      toast({ variant: 'destructive', title: '제목을 입력해주세요.' });
      return;
    }
    if (filteredIngredients.length === 0) {
      toast({ variant: 'destructive', title: '재료를 최소 1개 입력해주세요.' });
      return;
    }
    if (filteredSteps.length === 0) {
      toast({ variant: 'destructive', title: '조리 단계를 최소 1개 입력해주세요.' });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const { url } = await uploadImage(imageFile);
        imageUrl = url;
      }

      const { recipe } = await createRecipe({
        title: title.trim(),
        description: description.trim(),
        ingredients: filteredIngredients,
        steps: filteredSteps,
        imageUrl,
        cookTime: cookTime ? Number(cookTime) : undefined,
        servings: servings ? Number(servings) : undefined,
      });

      toast({ title: '레시피가 등록되었습니다!' });
      router.push(`/recipes/${recipe.id}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: err instanceof Error ? err.message : '다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="text-center py-20 text-muted-foreground">로딩 중...</div>;
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">새 레시피 작성</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="레시피 이름을 입력하세요"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="레시피에 대한 간단한 설명을 입력하세요"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cookTime">조리 시간 (분)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">인분</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이미지 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle>대표 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              aria-label="이미지 업로드"
            />
            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative h-56 w-full overflow-hidden rounded-lg border">
                  <Image src={imagePreview} alt="미리보기" fill className="object-cover" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  이미지 제거
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm">클릭하여 이미지 선택</span>
                <span className="text-xs">PNG, JPG, WEBP 지원</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* 재료 */}
        <Card>
          <CardHeader>
            <CardTitle>재료 *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredients.map((ingredient, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder={`재료 ${idx + 1}`}
                  value={ingredient}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                  aria-label={`재료 ${idx + 1}`}
                />
                {ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(idx)}
                    aria-label={`재료 ${idx + 1} 삭제`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <PlusCircle className="mr-2 h-4 w-4" />
              재료 추가
            </Button>
          </CardContent>
        </Card>

        {/* 조리 단계 */}
        <Card>
          <CardHeader>
            <CardTitle>조리 단계 *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground self-start mt-0.5">
                  {idx + 1}
                </span>
                <Textarea
                  placeholder={`${idx + 1}번째 단계를 입력하세요`}
                  rows={2}
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  aria-label={`조리 단계 ${idx + 1}`}
                  className="flex-1"
                />
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(idx)}
                    aria-label={`단계 ${idx + 1} 삭제`}
                    className="self-start mt-0.5"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <PlusCircle className="mr-2 h-4 w-4" />
              단계 추가
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '레시피 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}
