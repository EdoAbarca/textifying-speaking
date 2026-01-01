import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      
      // Set user and token (called after successful login/register)
      setAuth: (user, accessToken) => set({ user, accessToken }),
      
      // Clear auth state (called on logout)
      clearAuth: () => set({ user: null, accessToken: null }),
      
      // Check if user is authenticated
      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.accessToken && !!state.user;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);

export default useAuthStore;
