import irsdk from "node-irsdk-2023";
import { Server, WebSocket } from "ws";
import { ClientSettings, WebSocketWithSettings } from "./types";
import { getFields } from "./utils";

export class iRacingSDKWebsocketServer {
  private port: number;
  private sessionInfoUpdateInterval: number;
  private telemetryUpdateInterval: number;
  private connectionStatus: boolean;
  private wss: Server;

  constructor({
    port,
    sessionInfoUpdateInterval,
    telemetryUpdateInterval,
  }: {
    port: number;
    sessionInfoUpdateInterval: number;
    telemetryUpdateInterval: number;
  }) {
    this.port = port;
    this.sessionInfoUpdateInterval = sessionInfoUpdateInterval;
    this.telemetryUpdateInterval = telemetryUpdateInterval;
    this.connectionStatus = false;
    this.wss = new WebSocket.WebSocketServer({ port: this.port });

    const iracing = irsdk.init({
      telemetryUpdateInterval: this.telemetryUpdateInterval,
      sessionInfoUpdateInterval: this.sessionInfoUpdateInterval,
    });

    const defaultClientSettings = {
      sessionInfo: { requestedFields: [] },
      telemetry: { requestedFields: [] },
    };

    this.wss.on("connection", (socket: WebSocketWithSettings) => {
      socket.send(JSON.stringify({ connected: this.connectionStatus }));
      socket.send(
        JSON.stringify({
          telemetry: iracing.telemetry?.values || null,
          sessionInfo: iracing.sessionInfo?.data || null,
        })
      );

      socket.settings = defaultClientSettings;

      socket.on("message", (message: string) => {
        let parsedMessage: ClientSettings;

        try {
          parsedMessage = JSON.parse(message);
        } catch (e) {
          socket.send(
            JSON.stringify({
              error: true,
              message: "Invalid JSON",
            })
          );
          return;
        }

        if (
          Array.isArray(parsedMessage?.telemetry?.requestedFields) &&
          socket.settings
        ) {
          socket.settings.telemetry.requestedFields =
            parsedMessage.telemetry.requestedFields;
          if (iracing.telemetry) {
            socket.send(
              JSON.stringify({
                telemetry: getFields(
                  iracing.telemetry.values,
                  parsedMessage.telemetry.requestedFields
                ),
              })
            );
          }
        }

        if (
          Array.isArray(parsedMessage?.sessionInfo?.requestedFields) &&
          socket.settings
        ) {
          socket.settings.sessionInfo.requestedFields =
            parsedMessage.sessionInfo.requestedFields;
          if (iracing.sessionInfo) {
            socket.send(
              JSON.stringify({
                sessionInfo: getFields(
                  iracing.sessionInfo.data,
                  parsedMessage.sessionInfo.requestedFields
                ),
              })
            );
          }
        }
      });
    });

    iracing.on("Telemetry", (telemetryEvent) => {
      this.wss.clients.forEach((socket) => {
        const clientSettings =
          (socket as unknown as WebSocketWithSettings)?.settings ||
          defaultClientSettings;

        if (clientSettings.telemetry.requestedFields.length === 0) return;
        const fields = getFields(
          telemetryEvent.data,
          clientSettings.telemetry.requestedFields
        );
        socket.send(JSON.stringify({ telemetry: fields }));
      });
    });

    iracing.on("SessionInfo", (sessionEvent) => {
      this.wss.clients.forEach((socket) => {
        socket.send(JSON.stringify({ sessionInfo: sessionEvent }));
      });
    });

    iracing.on("Connected", () => {
      this.connectionStatus = true;

      this.wss.clients.forEach((socket) => {
        socket.send(JSON.stringify({ connected: this.connectionStatus }));
      });
    });

    iracing.on("Disconnected", () => {
      this.connectionStatus = false;

      this.wss.clients.forEach((socket) => {
        socket.send(JSON.stringify({ connected: this.connectionStatus }));
      });
    });
  }
}
