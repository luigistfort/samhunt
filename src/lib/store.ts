// src/lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchParams, BusinessProfile } from '@/types';

interface AppState {
  // Search
  currentSearch: SearchParams;
  setCurrentSearch: (params: SearchParams) => void;
  resetSearch: () => void;

  // Recent searches (client-side)
  recentSearches: Array<{ query: string; params: SearchParams; timestamp: number }>;
  addRecentSearch: (query: string, params: SearchParams) => void;

  // Favorites (optimistic UI cache)
  favoritedNoticeIds: Set<string>;
  addFavorite: (noticeId: string) => void;
  removeFavorite: (noticeId: string) => void;
  setFavorites: (noticeIds: string[]) => void;

  // Profile (local cache)
  profile: BusinessProfile | null;
  setProfile: (profile: BusinessProfile | null) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  profileDrawerOpen: boolean;
  setProfileDrawerOpen: (open: boolean) => void;
}

const DEFAULT_SEARCH: SearchParams = {
  page: 1,
  limit: 25,
  sortBy: 'postedDate',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentSearch: DEFAULT_SEARCH,
      setCurrentSearch: (params) => set({ currentSearch: params }),
      resetSearch: () => set({ currentSearch: DEFAULT_SEARCH }),

      recentSearches: [],
      addRecentSearch: (query, params) =>
        set((state) => ({
          recentSearches: [
            { query, params, timestamp: Date.now() },
            ...state.recentSearches
              .filter((s) => s.query !== query)
              .slice(0, 9),
          ],
        })),

      favoritedNoticeIds: new Set(),
      addFavorite: (noticeId) =>
        set((state) => ({
          favoritedNoticeIds: new Set([...state.favoritedNoticeIds, noticeId]),
        })),
      removeFavorite: (noticeId) =>
        set((state) => {
          const next = new Set(state.favoritedNoticeIds);
          next.delete(noticeId);
          return { favoritedNoticeIds: next };
        }),
      setFavorites: (noticeIds) =>
        set({ favoritedNoticeIds: new Set(noticeIds) }),

      profile: null,
      setProfile: (profile) => set({ profile }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      profileDrawerOpen: false,
      setProfileDrawerOpen: (open) => set({ profileDrawerOpen: open }),
    }),
    {
      name: 'samhunt-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        favoritedNoticeIds: Array.from(state.favoritedNoticeIds),
      }),
      // Rehydrate Set from array
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as any).favoritedNoticeIds)) {
          state.favoritedNoticeIds = new Set((state as any).favoritedNoticeIds);
        }
      },
    }
  )
);
