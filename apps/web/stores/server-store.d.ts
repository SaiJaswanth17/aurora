import { Server, Channel } from '@aurora/shared';
interface ServerState {
    servers: Record<string, Server>;
    channels: Record<string, Channel[]>;
    activeServer: string | null;
    activeChannel: string | null;
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
export declare const useServerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ServerState>>;
export declare const useServers: () => Server[];
export declare const useActiveServerId: () => string | null;
export declare const useActiveChannelId: () => string | null;
export declare const useServerChannels: (serverId: string) => Channel[];
export declare const useServerById: (serverId: string) => Server;
export declare const useChannelById: (channelId: string) => any;
export {};
//# sourceMappingURL=server-store.d.ts.map