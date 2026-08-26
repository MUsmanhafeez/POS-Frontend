'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  username?: string;
  branch_id?: string | null;
  role: { name: string; display_name: string; permissions: string[] };
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (...permissions: string[]) => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      async login(identifier, password) {
        const { data } = await api.post('/auth/login', { identifier, password });
        const body = data.body;
        set({ token: body.token, user: body.user });
        localStorage.setItem('forkiva_auth', JSON.stringify({ token: body.token, user: body.user }));
      },
      async logout() {
        try {
          await api.post('/auth/logout');
        } catch {
          /* ignore */
        }
        set({ token: null, user: null });
        localStorage.removeItem('forkiva_auth');
      },
      can(...permissions) {
        const user = get().user;
        if (!user) return false;
        if (user.role.name === 'super_admin') return true;
        return permissions.some((p) => user.role.permissions.includes(p));
      },
    }),
    { name: 'forkiva-auth-store' }
  )
);
