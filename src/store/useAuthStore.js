import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email, _password) => {
        if (email === 'admin@chairestrucking.com') {
          const user = {
            id: '1',
            email,
            role: 'admin',
            nombre: 'Administrador',
          };
          set({ user, isAuthenticated: true });
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
