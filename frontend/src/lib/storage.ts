import { useEffect, useState } from 'react';
import type { Named } from './types';

export interface Recent {
  name: string;
  slug: string;
  kind: 'items' | 'npcs';
}
export type Favorite = Recent;
const FAVORITES_KEY = 'sandrock:favorites';

export function readFavorites(): Favorite[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(FAVORITES_KEY) || '[]',
    );
    if (!Array.isArray(value)) return [];
    return value.filter(
      (v): v is Favorite =>
        v &&
        typeof v.name === 'string' &&
        typeof v.slug === 'string' &&
        ['items', 'npcs'].includes(v.kind),
    );
  } catch {
    return [];
  }
}

function writeFavorites(favorites: Favorite[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new Event('sandrock:favorites'));
  } catch {
    /* Favorites are optional when browsing in a restricted context. */
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);
  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener('sandrock:favorites', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sandrock:favorites', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const isFavorite = (slug: string, kind: Favorite['kind']) =>
    favorites.some(
      (favorite) => favorite.slug === slug && favorite.kind === kind,
    );
  const toggleFavorite = (entity: Named, kind: Favorite['kind']) => {
    const exists = isFavorite(entity.slug, kind);
    const next = exists
      ? favorites.filter(
          (favorite) => favorite.slug !== entity.slug || favorite.kind !== kind,
        )
      : [{ name: entity.name, slug: entity.slug, kind }, ...favorites];
    setFavorites(next);
    writeFavorites(next);
  };
  return { favorites, isFavorite, toggleFavorite };
}
export function readRecent(): Recent[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem('sandrock:recent') || '[]',
    );
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (v): v is Recent =>
          v &&
          typeof v.name === 'string' &&
          typeof v.slug === 'string' &&
          ['items', 'npcs'].includes(v.kind),
      )
      .slice(0, 6);
  } catch {
    return [];
  }
}
export function useRemember(item: Named | undefined, kind: Recent['kind']) {
  useEffect(() => {
    if (!item) return;
    const recent = readRecent().filter(
      (r) => r.slug !== item.slug || r.kind !== kind,
    );
    try {
      localStorage.setItem(
        'sandrock:recent',
        JSON.stringify(
          [{ name: item.name, slug: item.slug, kind }, ...recent].slice(0, 6),
        ),
      );
    } catch {
      /* Browsing still works when storage is unavailable. */
    }
  }, [item, kind]);
}
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
export function initialTheme(): boolean {
  try {
    const saved = localStorage.getItem('sandrock:theme');
    return saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}
