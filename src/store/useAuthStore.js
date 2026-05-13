import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logActivity } from '../utils/logActivity';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email, password) => {
        if (password === 'chaires2026') {
          const user = {
            id: email,
            email,
            role: 'admin',
            nombre: email.split('@')[0],
          };
          set({ user, isAuthenticated: true });
          logActivity(user, 'Inició sesión', '');
          return true;
        }
        return false;
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

export default useAuthStore;
