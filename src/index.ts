import WebSocket, * as ws from "ws";
import irsdk from "node-irsdk-2023";
import JsIrSdk from "node-irsdk-2023/src/JsIrSdk";

interface ClientSettings {
  requestedFields: string[];
  sendInterval: number;
  intervalId: NodeJS.Timeout | null;
}

interface ParsedMessage {
  sessionInfo?: ClientSettings;
  telemetry?: ClientSettings;
  telemetryDescription?: ClientSettings;
  update?: boolean;
  getAll?: boolean;
}

const MIN_INTERVAL = 16;
const PORT = 4000;
let connected = false;

const iracing = irsdk.init({ telemetryUpdateInterval: MIN_INTERVAL });
const wss = new ws.WebSocketServer({ port: PORT });

const getFields = (data: any, fields: string[]): any => {
  const result: Record<string, any> = {};

  fields.forEach((field: string) => {
    const parts = field.split(".");
    let current: any = data;
    let currentResult: any = result;

    parts.forEach((part: string, index: number) => {
      if (current && current[part] !== undefined) {
        if (index === parts.length - 1) {
          currentResult[part] = current[part];
        } else {
          currentResult[part] = currentResult[part] || {};
          currentResult = currentResult[part];
          current = current[part];
        }
      } else {
        if (index === parts.length - 1) {
          currentResult[part] = null;
        } else {
          currentResult[part] = currentResult[part] || {};
          currentResult = currentResult[part];
        }
        return;
      }
    });
  });

  return result;
};

const clientSettings = new Map<WebSocket, Record<string, ClientSettings>>();

const broadcast = (data: any): void => {
  const message = JSON.stringify(data);
  clientSettings.forEach((settings, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        console.error("Error broadcasting message:", error);
      }
    }
  });
};

const setIntervalForClient = (
  ws: WebSocket,
  type: string,
  settings: ClientSettings,
  iracing: JsIrSdk,
  field: "telemetry" | "telemetryDescription" | "sessionInfo"
): void => {
  const interval =
    settings.sendInterval >= MIN_INTERVAL ? settings.sendInterval : 0;

  if (settings.intervalId) clearInterval(settings.intervalId);

  if (interval > 0) {
    settings.intervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const result = getFields(iracing[field], settings.requestedFields);
        ws.send(JSON.stringify({ [type]: result }));
      } else {
        clearInterval(settings.intervalId as NodeJS.Timeout);
      }
    }, interval);
  }
};

wss.on("connection", (ws: WebSocket) => {
  ws.send(JSON.stringify({ connected }));

  const settings: {
    sessionInfo: {
      requestedFields: string[];
      sendInterval: number;
      intervalId: null | NodeJS.Timeout;
    };
    telemetry: {
      requestedFields: string[];
      sendInterval: number;
      intervalId: null | NodeJS.Timeout;
    };
    telemetryDescription: {
      requestedFields: string[];
      sendInterval: number;
      intervalId: null | NodeJS.Timeout;
    };
  } = {
    sessionInfo: { requestedFields: [], sendInterval: 0, intervalId: null },
    telemetry: { requestedFields: [], sendInterval: 0, intervalId: null },
    telemetryDescription: {
      requestedFields: [],
      sendInterval: 0,
      intervalId: null,
    },
  };

  clientSettings.set(ws, settings);

  ws.on("message", (message: string) => {
    let parsedMessage: ParsedMessage;

    try {
      parsedMessage = JSON.parse(message);
    } catch (e) {
      ws.send(
        JSON.stringify({
          error: true,
          message: "Invalid JSON",
        })
      );
      return;
    }

    const { sessionInfo, telemetryDescription, telemetry, update, getAll } =
      parsedMessage;

    if (sessionInfo?.requestedFields) {
      settings.sessionInfo.requestedFields = sessionInfo.requestedFields;
      settings.sessionInfo.sendInterval = sessionInfo.sendInterval || 0;
      setIntervalForClient(
        ws,
        "sessionInfo",
        settings.sessionInfo,
        iracing,
        "sessionInfo"
      );
    }

    if (telemetryDescription?.requestedFields) {
      settings.telemetryDescription.requestedFields =
        telemetryDescription.requestedFields;
      settings.telemetryDescription.sendInterval =
        telemetryDescription.sendInterval || 0;
      setIntervalForClient(
        ws,
        "telemetryDescription",
        settings.telemetryDescription,
        iracing,
        "telemetryDescription"
      );
    }

    if (telemetry?.requestedFields) {
      settings.telemetry.requestedFields = telemetry.requestedFields;
      settings.telemetry.sendInterval = telemetry.sendInterval || 0;
      setIntervalForClient(
        ws,
        "telemetry",
        settings.telemetry,
        iracing,
        "telemetry"
      );
    }

    if (update) {
      const result = {
        sessionInfo: getFields(
          iracing.sessionInfo,
          settings.sessionInfo.requestedFields
        ),
        telemetry: getFields(
          iracing.telemetry,
          settings.telemetry.requestedFields
        ),
        telemetryDescription: getFields(
          iracing.telemetryDescription,
          settings.telemetryDescription.requestedFields
        ),
      };
      ws.send(JSON.stringify(result));
    }

    if (getAll) {
      const result = {
        sessionInfo: iracing.sessionInfo,
        telemetry: iracing.telemetry,
        telemetryDescription: iracing.telemetryDescription,
      };
      ws.send(JSON.stringify(result));
    }
  });

  ws.on("close", () => {
    if (settings.sessionInfo.intervalId)
      clearInterval(settings.sessionInfo.intervalId);
    if (settings.telemetry.intervalId)
      clearInterval(settings.telemetry.intervalId);
    if (settings.telemetryDescription.intervalId)
      clearInterval(settings.telemetryDescription.intervalId);

    clientSettings.delete(ws);
  });
});

iracing.on("Connected", () => {
  console.log("iRacing connected..");
  connected = true;
  broadcast({ connected: true });
});

iracing.on("Disconnected", () => {
  console.log("iRacing disconnected..");
  connected = false;
  broadcast({ connected: false });
});

console.log("WebSocket server is listening on ws://localhost:" + PORT);

process.on("uncaughtException", (err: Error) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
