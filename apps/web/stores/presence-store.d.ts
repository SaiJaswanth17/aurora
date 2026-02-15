import { User, UserStatus } from '@aurora/shared';
interface PresenceState {
    users: Record<string, User>;
    onlineUsers: Set<string>;
    setUser: (user: User) => void;
    updateUserStatus: (userId: string, status: UserStatus) => void;
    removeUser: (userId: string) => void;
    setUsers: (users: User[]) => void;
    clearUsers: () => void;
}
export declare const usePresenceStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PresenceState>>;
export declare const useAllUsers: () => Record<string, User>;
export declare const useOnlineUsers: () => User[];
export declare const useUserById: (userId: string) => User;
export declare const useIsUserOnline: (userId: string) => boolean;
export {};
//# sourceMappingURL=presence-store.d.ts.map