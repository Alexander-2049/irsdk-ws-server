import * as ws from "ws";
import irsdk from "node-irsdk-2023";
import { getExecutionArguments, getFields } from "./utils";
import { SessionInfoEvent, TelemetryEvent } from "node-irsdk-2023/src/JsIrSdk";
import { ClientSettings, WebSocketWithSettings } from "./types";

const { PORT, SESSION_INFO_UPDATE_INTERVAL, TELEMETRY_UPDATE_INTERVAL } =
  getExecutionArguments();

console.log("[IRSDK-WEBSOCKET-SERVER] PORT: " + PORT);
console.log(
  "[IRSDK-WEBSOCKET-SERVER] TELEMETRY UPDATE INTERVAL: " +
    TELEMETRY_UPDATE_INTERVAL +
    "ms"
);
console.log(
  "[IRSDK-WEBSOCKET-SERVER] SESSION INFO UPDATE INTERVAL: " +
    SESSION_INFO_UPDATE_INTERVAL +
    "ms"
);

let connectionStatus = false;

const iracing = irsdk.init({
  telemetryUpdateInterval: TELEMETRY_UPDATE_INTERVAL,
  sessionInfoUpdateInterval: SESSION_INFO_UPDATE_INTERVAL,
});
const wss = new ws.WebSocketServer({ port: PORT });

const defaultClientSettings = {
  sessionInfo: { requestedFields: [] },
  telemetry: { requestedFields: [] },
};

wss.on("connection", (socket: WebSocketWithSettings) => {
  socket.send(JSON.stringify({ connected: connectionStatus }));
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
          JSON.stringify(
            getFields(
              iracing.telemetry.values,
              parsedMessage.telemetry.requestedFields
            )
          )
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
          JSON.stringify(
            getFields(
              iracing.sessionInfo.data,
              parsedMessage.sessionInfo.requestedFields
            )
          )
        );
      }
    }
  });
});

iracing.on("Telemetry", (telemetryEvent: TelemetryEvent) => {
  wss.clients.forEach((socket) => {
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

iracing.on("SessionInfo", (sessionEvent: SessionInfoEvent) => {
  wss.clients.forEach((socket) => {
    socket.send(JSON.stringify({ sessionInfo: sessionEvent }));
  });
});

iracing.on("Connected", () => {
  connectionStatus = true;

  wss.clients.forEach((socket) => {
    socket.send(JSON.stringify({ connected: connectionStatus }));
  });
});

iracing.on("Disconnected", () => {
  connectionStatus = false;

  wss.clients.forEach((socket) => {
    socket.send(JSON.stringify({ connected: connectionStatus }));
  });
});

console.log("WebSocket server is listening on ws://localhost:" + PORT);

process.on("uncaughtException", (err: Error) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
