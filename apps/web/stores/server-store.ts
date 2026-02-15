import { create } from 'zustand';
import { Server, Channel } from '@aurora/shared';

interface ServerState {
  servers: Record<string, Server>; // serverId -> Server
  channels: Record<string, Channel[]>; // serverId -> Channel[]
  activeServer: string | null;
  activeChannel: string | null;

  // Actions
  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  updateServer: (serverId: string, updates: Partial<Server>) => void;
  removeServer: (serverId: string) => void;
  setActiveServer: (serverId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  setChannels: (serverId: string, channels: Channel[]) => void;
  addChannel: (serverId: string, channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  removeChannel: (channelId: string) => void;
}

export const useServerStore = create<ServerState>((set) => ({
  // Initial state
  servers: {},
  channels: {},
  activeServer: null,
  activeChannel: null,

  // Actions
  setServers: servers => {
    const serversMap: Record<string, Server> = {};
    servers.forEach(server => {
      serversMap[server.id] = server;
    });
    set({ servers: serversMap });
  },

  addServer: server => {
    set(state => ({
      servers: {
        ...state.servers,
        [server.id]: server,
      },
    }));
  },

  updateServer: (serverId, updates) => {
    set(state => {
      const server = state.servers[serverId];
      if (!server) return state;

      return {
        servers: {
          ...state.servers,
          [serverId]: { ...server, ...updates },
        },
      };
    });
  },

  removeServer: serverId => {
    set(state => {
      const servers = { ...state.servers };
      delete servers[serverId];

      const channels = { ...state.channels };
      delete channels[serverId];

      const newActiveServer = state.activeServer === serverId ? null : state.activeServer;
      const newActiveChannel = state.channels[serverId]?.some(ch => ch.id === state.activeChannel)
        ? null
        : state.activeChannel;

      return {
        servers,
        channels,
        activeServer: newActiveServer,
        activeChannel: newActiveChannel,
      };
    });
  },

  setActiveServer: serverId => {
    set({ activeServer: serverId });
  },

  setActiveChannel: channelId => {
    set({ activeChannel: channelId });
  },

  setChannels: (serverId, channels) => {
    set(state => ({
      channels: {
        ...state.channels,
        [serverId]: channels,
      },
    }));
  },

  addChannel: (serverId, channel) => {
    set(state => ({
      channels: {
        ...state.channels,
        [serverId]: [...(state.channels[serverId] || []), channel],
      },
    }));
  },

  updateChannel: (channelId, updates) => {
    set(state => {
      const newChannels = { ...state.channels };

      // Find the channel across all servers and update it
      Object.keys(newChannels).forEach(serverId => {
        const channels = newChannels[serverId];
        const channelIndex = channels.findIndex(ch => ch.id === channelId);
        if (channelIndex !== -1) {
          channels[channelIndex] = { ...channels[channelIndex], ...updates };
        }
      });

      return { channels: newChannels };
    });
  },

  removeChannel: channelId => {
    set(state => {
      const newChannels = { ...state.channels };

      // Remove channel from all servers
      Object.keys(newChannels).forEach(serverId => {
        newChannels[serverId] = newChannels[serverId].filter(ch => ch.id !== channelId);
      });

      const newActiveChannel = state.activeChannel === channelId ? null : state.activeChannel;

      return { channels: newChannels, activeChannel: newActiveChannel };
    });
  },
}));

// Selectors
export const useServers = () => useServerStore(state => Object.values(state.servers));
export const useActiveServerId = () => useServerStore(state => state.activeServer);
export const useActiveChannelId = () => useServerStore(state => state.activeChannel);
export const useServerChannels = (serverId: string) =>
  useServerStore(state => state.channels[serverId] || []);
export const useServerById = (serverId: string) => useServerStore(state => state.servers[serverId]);
export const useChannelById = (channelId: string) => {
  const channels = useServerStore(state => state.channels);
  for (const serverChannels of Object.values(channels)) {
    const channel = serverChannels.find(ch => ch.id === channelId);
    if (channel) return channel;
  }
  return null;
};
