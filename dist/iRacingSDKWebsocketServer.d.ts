export declare class iRacingSDKWebsocketServer {
    private port;
    private sessionInfoUpdateInterval;
    private telemetryUpdateInterval;
    private connectionStatus;
    private wss;
    constructor({ port, sessionInfoUpdateInterval, telemetryUpdateInterval, }: {
        port: number;
        sessionInfoUpdateInterval: number;
        telemetryUpdateInterval: number;
    });
}
