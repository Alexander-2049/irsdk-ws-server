"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const iRacingSDKWebsocketServer_1 = require("./iRacingSDKWebsocketServer");
const { PORT, SESSION_INFO_UPDATE_INTERVAL, TELEMETRY_UPDATE_INTERVAL } = (0, utils_1.getExecutionArguments)();
console.log("[IRSDK-WEBSOCKET-SERVER] PORT: " + PORT);
console.log("[IRSDK-WEBSOCKET-SERVER] TELEMETRY UPDATE INTERVAL: " +
    TELEMETRY_UPDATE_INTERVAL +
    "ms");
console.log("[IRSDK-WEBSOCKET-SERVER] SESSION INFO UPDATE INTERVAL: " +
    SESSION_INFO_UPDATE_INTERVAL +
    "ms");
const irsdkwss = new iRacingSDKWebsocketServer_1.iRacingSDKWebsocketServer({
    port: PORT,
    sessionInfoUpdateInterval: SESSION_INFO_UPDATE_INTERVAL,
    telemetryUpdateInterval: TELEMETRY_UPDATE_INTERVAL,
});
console.log("WebSocket server is listening on ws://localhost:" + PORT);
process.on("uncaughtException", (err) => {
    console.error("There was an uncaught error", err);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
