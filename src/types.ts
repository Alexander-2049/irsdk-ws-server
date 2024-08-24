import WebSocket from "ws";

export interface ClientSettings {
  sessionInfo: {
    requestedFields: string[];
  };
  telemetry: {
    requestedFields: string[];
  };
}

export interface WebSocketWithSettings extends WebSocket {
  settings?: ClientSettings; // Replace `any` with a more specific type if needed
}
