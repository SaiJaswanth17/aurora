interface WebSocketClientOptions {
    url: string;
}
export declare class WebSocketClient {
    private options;
    private ws;
    private reconnectAttempts;
    private reconnectTimeout;
    private isConnecting;
    private isDestroyed;
    private listeners;
    constructor(options: WebSocketClientOptions);
    connect(): Promise<void>;
    private handleOpen;
    private handleMessage;
    private handleClose;
    private handleError;
    private scheduleReconnect;
    send(type: string, payload?: unknown): void;
    on(event: string, callback: (data: unknown) => void): () => void;
    private emit;
    disconnect(): void;
    isConnected(): boolean;
    get readyState(): number;
}
export {};
//# sourceMappingURL=websocket-client.d.ts.map