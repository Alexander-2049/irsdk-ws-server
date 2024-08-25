"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws = __importStar(require("ws"));
const node_irsdk_2023_1 = __importDefault(require("node-irsdk-2023"));
const utils_1 = require("./utils");
const { PORT, SESSION_INFO_UPDATE_INTERVAL, TELEMETRY_UPDATE_INTERVAL } = (0, utils_1.getExecutionArguments)();
console.log("[IRSDK-WEBSOCKET-SERVER] PORT: " + PORT);
console.log("[IRSDK-WEBSOCKET-SERVER] TELEMETRY UPDATE INTERVAL: " +
    TELEMETRY_UPDATE_INTERVAL +
    "ms");
console.log("[IRSDK-WEBSOCKET-SERVER] SESSION INFO UPDATE INTERVAL: " +
    SESSION_INFO_UPDATE_INTERVAL +
    "ms");
let connectionStatus = false;
const iracing = node_irsdk_2023_1.default.init({
    telemetryUpdateInterval: TELEMETRY_UPDATE_INTERVAL,
    sessionInfoUpdateInterval: SESSION_INFO_UPDATE_INTERVAL,
});
const wss = new ws.WebSocketServer({ port: PORT });
const defaultClientSettings = {
    sessionInfo: { requestedFields: [] },
    telemetry: { requestedFields: [] },
};
wss.on("connection", (socket) => {
    var _a, _b;
    socket.send(JSON.stringify({ connected: connectionStatus }));
    socket.send(JSON.stringify({
        telemetry: ((_a = iracing.telemetry) === null || _a === void 0 ? void 0 : _a.values) || null,
        sessionInfo: ((_b = iracing.sessionInfo) === null || _b === void 0 ? void 0 : _b.data) || null,
    }));
    socket.settings = defaultClientSettings;
    socket.on("message", (message) => {
        var _a, _b;
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        }
        catch (e) {
            socket.send(JSON.stringify({
                error: true,
                message: "Invalid JSON",
            }));
            return;
        }
        if (Array.isArray((_a = parsedMessage === null || parsedMessage === void 0 ? void 0 : parsedMessage.telemetry) === null || _a === void 0 ? void 0 : _a.requestedFields) &&
            socket.settings) {
            socket.settings.telemetry.requestedFields =
                parsedMessage.telemetry.requestedFields;
            if (iracing.telemetry) {
                socket.send(JSON.stringify({
                    telemetry: (0, utils_1.getFields)(iracing.telemetry.values, parsedMessage.telemetry.requestedFields),
                }));
            }
        }
        if (Array.isArray((_b = parsedMessage === null || parsedMessage === void 0 ? void 0 : parsedMessage.sessionInfo) === null || _b === void 0 ? void 0 : _b.requestedFields) &&
            socket.settings) {
            socket.settings.sessionInfo.requestedFields =
                parsedMessage.sessionInfo.requestedFields;
            if (iracing.sessionInfo) {
                socket.send(JSON.stringify({
                    sessionInfo: (0, utils_1.getFields)(iracing.sessionInfo.data, parsedMessage.sessionInfo.requestedFields),
                }));
            }
        }
    });
});
iracing.on("Telemetry", (telemetryEvent) => {
    wss.clients.forEach((socket) => {
        const clientSettings = (socket === null || socket === void 0 ? void 0 : socket.settings) ||
            defaultClientSettings;
        if (clientSettings.telemetry.requestedFields.length === 0)
            return;
        const fields = (0, utils_1.getFields)(telemetryEvent.data, clientSettings.telemetry.requestedFields);
        socket.send(JSON.stringify({ telemetry: fields }));
    });
});
iracing.on("SessionInfo", (sessionEvent) => {
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
process.on("uncaughtException", (err) => {
    console.error("There was an uncaught error", err);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
