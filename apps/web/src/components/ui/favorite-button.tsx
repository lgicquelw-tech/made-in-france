'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  brandId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export function FavoriteButton({ 
  brandId, 
  size = 'md', 
  variant = 'icon',
  className 
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFav = isFavorite(brandId);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push('/connexion');
      return;
    }

    setIsLoading(true);
    setIsAnimating(true);

    const success = await toggleFavorite(brandId);
    
    if (success) {
      setTimeout(() => setIsAnimating(false), 300);
    }
    
    setIsLoading(false);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
          isFav 
            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <Heart 
          className={cn(
            sizeClasses[size],
            isFav && 'fill-current',
            isAnimating && 'animate-ping'
          )} 
        />
        {isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        buttonSizeClasses[size],
        'rounded-full transition-all hover:scale-110 active:scale-95',
        isFav 
          ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 hover:text-red-500 bg-white/80 hover:bg-white shadow-sm',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart 
        className={cn(
          sizeClasses[size],
          isFav && 'fill-current',
          isAnimating && 'animate-bounce'
        )} 
      />
    </button>
  );
}