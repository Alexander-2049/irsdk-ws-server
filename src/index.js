const WebSocket = require("ws");
const irsdk = require("node-irsdk-2023");

const iracing = irsdk.init({ telemetryUpdateInterval: 100 });
const wss = new WebSocket.Server({ port: 8080 });

const getFields = (data, fields) => {
  const result = {};

  fields.forEach((field) => {
    const parts = field.split(".");
    let current = data;
    let currentResult = result;

    parts.forEach((part, index) => {
      if (current && current[part] !== undefined) {
        // Field exists in data
        if (index === parts.length - 1) {
          currentResult[part] = current[part];
        } else {
          currentResult[part] = currentResult[part] || {};
          currentResult = currentResult[part];
          current = current[part];
        }
      } else {
        // Field does not exist in data, but we need to preserve structure
        if (index === parts.length - 1) {
          currentResult[part] = null;
        } else {
          currentResult[part] = currentResult[part] || {};
          currentResult = currentResult[part];
        }
        return; // No need to continue as the field doesn't exist
      }
    });
  });

  return result;
};

const MIN_INTERVAL = 20;
let connected = false;

const clientSettings = new Map();

const broadcast = (data) => {
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

const setIntervalForClient = (ws, type, settings, iracingData) => {
  const interval =
    settings.sendInterval >= MIN_INTERVAL ? settings.sendInterval : 0;

  if (settings.intervalId) clearInterval(settings.intervalId);

  if (interval > 0) {
    settings.intervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const result = getFields(iracingData, settings.requestedFields);
        ws.send(JSON.stringify({ [type]: result }));
      } else {
        clearInterval(settings.intervalId);
      }
    }, interval);
  }
};

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ connected }));

  const settings = {
    sessionInfo: { requestedFields: [], sendInterval: 0, intervalId: null },
    telemetry: { requestedFields: [], sendInterval: 0, intervalId: null },
    telemetryDescription: {
      requestedFields: [],
      sendInterval: 0,
      intervalId: null,
    },
  };

  clientSettings.set(ws, settings);

  ws.on("message", (message) => {
    let parsedMessage;

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
        iracing.sessionInfo
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
        iracing.telemetryDescription
      );
    }

    if (telemetry?.requestedFields) {
      settings.telemetry.requestedFields = telemetry.requestedFields;
      settings.telemetry.sendInterval = telemetry.sendInterval || 0;
      setIntervalForClient(
        ws,
        "telemetry",
        settings.telemetry,
        iracing.telemetry
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

console.log("WebSocket server is listening on ws://localhost:8080");

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  // It's usually recommended to shut down the process when this happens
  process.exit(1); // or handle cleanup and shutdown gracefully
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optionally: process.exit(1); to stop the application in production
});
