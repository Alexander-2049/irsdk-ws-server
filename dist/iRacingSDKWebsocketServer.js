"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iRacingSDKWebsocketServer = void 0;
const node_irsdk_2023_1 = __importDefault(require("node-irsdk-2023"));
const ws_1 = require("ws");
const utils_1 = require("./utils");
class iRacingSDKWebsocketServer {
    constructor({ port, sessionInfoUpdateInterval, telemetryUpdateInterval, }) {
        this.port = port;
        this.sessionInfoUpdateInterval = sessionInfoUpdateInterval;
        this.telemetryUpdateInterval = telemetryUpdateInterval;
        this.connectionStatus = false;
        this.wss = new ws_1.WebSocket.WebSocketServer({ port: this.port });
        const iracing = node_irsdk_2023_1.default.init({
            telemetryUpdateInterval: this.telemetryUpdateInterval,
            sessionInfoUpdateInterval: this.sessionInfoUpdateInterval,
        });
        const defaultClientSettings = {
            sessionInfo: { requestedFields: [] },
            telemetry: { requestedFields: [] },
        };
        this.wss.on("connection", (socket) => {
            var _a, _b;
            socket.send(JSON.stringify({ connected: this.connectionStatus }));
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
            this.wss.clients.forEach((socket) => {
                const clientSettings = (socket === null || socket === void 0 ? void 0 : socket.settings) ||
                    defaultClientSettings;
                if (clientSettings.telemetry.requestedFields.length === 0)
                    return;
                if (clientSettings.telemetry.requestedFields[0] === "*") {
                    socket.send(JSON.stringify({
                        telemetry: telemetryEvent.data,
                    }));
                }
                else {
                    const fields = (0, utils_1.getFields)(telemetryEvent.data, clientSettings.telemetry.requestedFields);
                    socket.send(JSON.stringify({ telemetry: fields }));
                }
            });
        });
        iracing.on("SessionInfo", (sessionEvent) => {
            this.wss.clients.forEach((socket) => {
                const clientSettings = (socket === null || socket === void 0 ? void 0 : socket.settings) ||
                    defaultClientSettings;
                if (clientSettings.sessionInfo.requestedFields.length === 0)
                    return;
                if (clientSettings.sessionInfo.requestedFields[0] === "*") {
                    socket.send(JSON.stringify({
                        sessionInfo: sessionEvent.data,
                    }));
                }
                else {
                    const fields = (0, utils_1.getFields)(sessionEvent.data, clientSettings.sessionInfo.requestedFields);
                    socket.send(JSON.stringify({ sessionInfo: fields }));
                }
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
exports.iRacingSDKWebsocketServer = iRacingSDKWebsocketServer;
