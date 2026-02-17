'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  region: string | null;
  sector: string | null;
  sectorSlug: string | null;
  sectorColor: string | null;
}

interface Favorite {
  id: string;
  brandId: string;
  createdAt: string;
  brand: Brand;
}

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const userId = session?.user?.id;

  // Charger les favoris
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/users/${userId}/favorites`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.data);
        setFavoriteIds(new Set(data.data.map((f: Favorite) => f.brandId)));
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Charger au montage et quand userId change
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Vérifier si une marque est en favori
  const isFavorite = useCallback((brandId: string) => {
    return favoriteIds.has(brandId);
  }, [favoriteIds]);

  // Ajouter aux favoris
  const addFavorite = useCallback(async (brandId: string) => {
    if (!userId) return false;

    try {
      const res = await fetch(`${API_URL}/api/v1/users/${userId}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });

      if (res.ok) {
        setFavoriteIds(prev => new Set([...prev, brandId]));
        await fetchFavorites(); // Recharger la liste complète
        return true;
      }
    } catch (error) {
      console.error('Erreur ajout favori:', error);
    }
    return false;
  }, [userId, fetchFavorites]);

  // Retirer des favoris
  const removeFavorite = useCallback(async (brandId: string) => {
    if (!userId) return false;

    try {
      const res = await fetch(`${API_URL}/api/v1/users/${userId}/favorites/${brandId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(brandId);
          return newSet;
        });
        setFavorites(prev => prev.filter(f => f.brandId !== brandId));
        return true;
      }
    } catch (error) {
      console.error('Erreur suppression favori:', error);
    }
    return false;
  }, [userId]);

  // Toggle favori
  const toggleFavorite = useCallback(async (brandId: string) => {
    if (isFavorite(brandId)) {
      return removeFavorite(brandId);
    } else {
      return addFavorite(brandId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    favoriteIds,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
    isAuthenticated: !!userId,
  };
}