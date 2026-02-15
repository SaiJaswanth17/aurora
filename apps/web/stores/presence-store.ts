import { create } from 'zustand';
import { User, UserStatus } from '@aurora/shared';

interface PresenceState {
  users: Record<string, User>; // userId -> User
  onlineUsers: Set<string>;

  // Actions
  setUser: (user: User) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  removeUser: (userId: string) => void;
  setUsers: (users: User[]) => void;
  clearUsers: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  // Initial state
  users: {},
  onlineUsers: new Set(),

  // Actions
  setUser: user => {
    set(state => ({
      users: {
        ...state.users,
        [user.id]: user,
      },
    }));
  },

  updateUserStatus: (userId, status) => {
    set(state => {
      const existingUser = state.users[userId];
      if (!existingUser) return state;

      const updatedUser = { ...existingUser, status };
      const onlineUsers = new Set(state.onlineUsers);

      if (status === 'online') {
        onlineUsers.add(userId);
      } else {
        onlineUsers.delete(userId);
      }

      return {
        users: {
          ...state.users,
          [userId]: updatedUser,
        },
        onlineUsers,
      };
    });
  },

  removeUser: userId => {
    set(state => {
      const users = { ...state.users };
      delete users[userId];

      const onlineUsers = new Set(state.onlineUsers);
      onlineUsers.delete(userId);

      return { users, onlineUsers };
    });
  },

  setUsers: users => {
    const usersMap: Record<string, User> = {};
    const onlineUsers = new Set<string>();

    users.forEach(user => {
      usersMap[user.id] = user;
      if (user.status === 'online') {
        onlineUsers.add(user.id);
      }
    });

    set({ users: usersMap, onlineUsers });
  },

  clearUsers: () => {
    set({ users: {}, onlineUsers: new Set() });
  },
}));

// Selectors
export const useAllUsers = () => usePresenceStore(state => state.users);
export const useOnlineUsers = () => {
  const users = usePresenceStore(state => state.users);
  const onlineUserIds = usePresenceStore(state => Array.from(state.onlineUsers));

  return onlineUserIds.map(userId => users[userId]).filter(Boolean) as User[];
};
export const useUserById = (userId: string) => usePresenceStore(state => state.users[userId]);
export const useIsUserOnline = (userId: string) =>
  usePresenceStore(state => state.onlineUsers.has(userId));
