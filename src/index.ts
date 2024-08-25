import * as ws from "ws";
import irsdk from "node-irsdk-2023";
import { getExecutionArguments, getFields } from "./utils";
import { ClientSettings, WebSocketWithSettings } from "./types";
import { iRacingSDKWebsocketServer } from "./iRacingSDKWebsocketServer";

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

const irsdkwss = new iRacingSDKWebsocketServer({
  port: PORT,
  sessionInfoUpdateInterval: SESSION_INFO_UPDATE_INTERVAL,
  telemetryUpdateInterval: TELEMETRY_UPDATE_INTERVAL,
});

console.log("WebSocket server is listening on ws://localhost:" + PORT);

process.on("uncaughtException", (err: Error) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
