import { ReactNode } from 'react';
import { WebSocketClient } from './websocket-client';
interface WebSocketContextType {
    client: WebSocketClient | null;
    isConnected: boolean;
    send: (type: string, payload?: unknown) => void;
    on: (event: string, callback: (data: unknown) => void) => () => void;
}
export declare function WebSocketProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useWebSocket(): WebSocketContextType;
export { WebSocketClient };
//# sourceMappingURL=websocket-context.d.ts.map