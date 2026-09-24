import { act, renderHook } from '@testing-library/react';
import {
  readFavorites,
  readRecent,
  useDebounce,
  useFavorites,
  useRemember,
} from './storage';

test('debounce waits 300ms and cancels previous input', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
    initialProps: { value: '' },
  });
  rerender({ value: 'br' });
  act(() => vi.advanceTimersByTime(200));
  expect(result.current).toBe('');
  rerender({ value: 'bronze' });
  act(() => vi.advanceTimersByTime(299));
  expect(result.current).toBe('');
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBe('bronze');
  vi.useRealTimers();
});

test('recent items are deduplicated and tolerate corrupt storage', () => {
  localStorage.setItem('sandrock:recent', 'invalid-json');
  expect(readRecent()).toEqual([]);
  const item = { id: 1, name: 'Wood', slug: 'wood', description: '' };
  const { rerender } = renderHook(({ value }) => useRemember(value, 'items'), {
    initialProps: { value: item },
  });
  rerender({ value: { ...item } });
  expect(readRecent()).toEqual([{ name: 'Wood', slug: 'wood', kind: 'items' }]);
});

test('favorites persist and can be removed', () => {
  const item = { id: 1, name: 'Wood', slug: 'wood', description: '' };
  const { result } = renderHook(() => useFavorites());
  act(() => result.current.toggleFavorite(item, 'items'));
  expect(readFavorites()).toEqual([
    { name: 'Wood', slug: 'wood', kind: 'items' },
  ]);
  expect(result.current.isFavorite('wood', 'items')).toBe(true);
  act(() => result.current.toggleFavorite(item, 'items'));
  expect(readFavorites()).toEqual([]);
});
