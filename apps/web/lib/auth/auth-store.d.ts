import { User } from '@aurora/shared';
export interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}
export interface AuthActions {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
    setUser: (user: User | null) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState & AuthActions>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState & AuthActions, {
            user: any;
            isAuthenticated: boolean;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState & AuthActions) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState & AuthActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState & AuthActions, {
            user: any;
            isAuthenticated: boolean;
        }>>;
    };
}>;
//# sourceMappingURL=auth-store.d.ts.map