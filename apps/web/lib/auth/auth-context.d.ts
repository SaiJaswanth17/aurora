import type { ReactNode } from 'react';
import { type AuthState, type AuthActions } from './auth-store';
type AuthContextType = AuthState & Omit<AuthActions, 'setLoading' | 'setUser'>;
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=auth-context.d.ts.map