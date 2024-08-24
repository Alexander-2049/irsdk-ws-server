# IRSDK WebSocket Server Documentation

## Overview

The IRSDK WebSocket Server allows you to receive real-time telemetry and session information from the iRacing simulator through a WebSocket connection. Clients can connect to the server, request specific fields of data, and receive updates as the simulation runs.

This documentation provides details on how to interact with the server, including how to connect, send requests, and process the responses.

## Server Configuration

### Execution Arguments

The server can be configured using the following command-line arguments:

- **`--port` or `-p`**: Specifies the port on which the WebSocket server will run. Defaults to `4000`.
- **`--telemetry-interval` or `-ti`**: Sets the interval (in milliseconds) at which telemetry data is updated. Defaults to `4ms`.
- **`--session-info-interval` or `-si`**: Sets the interval (in milliseconds) at which session information is updated. Defaults to `16ms`.

### Example Usage

```bash
npm install
npm run build
# javascript file
node dist/index.js --port 8080 --telemetry-interval 10 --session-info-interval 50
# executable
dist/irsdk-wss.exe --port 8080 --telemetry-interval 10 --session-info-interval 50
```

## WebSocket API

### Connecting to the Server

To connect to the IRSDK WebSocket Server, establish a WebSocket connection to the server using the configured port:

```javascript
const socket = new WebSocket("ws://localhost:4000");
```

Upon connection, the server will send an initial message indicating the connection status and the current telemetry and session info data.

### Messages

Clients can send JSON messages to the server to request specific telemetry or session information fields. The server will respond with the requested data in real-time as the simulation progresses.

### Telemetry Request

Clients can request specific telemetry data fields by sending a `telemetry` request message. The server will respond with the current values for those fields.

#### Request Example

```json
{
  "telemetry": {
    "requestedFields": ["Throttle", "Brake", "RPM", "Gear"]
  }
}
```

#### Response Example

```json
{
  "telemetry": {
    "Throttle": 0,
    "Brake": 1,
    "RPM": 2947.270263671875,
    "Gear": 0
  }
}
```

### Session Info Request

Clients can request specific session information fields by sending a `sessionInfo` request message. The server will respond with the current values for those fields.

#### Request Example

```json
{
  "sessionInfo": {
    "requestedFields": ["WeekendInfo"]
  }
}
```

#### Response Example

```json
{
  "WeekendInfo": {
    "TrackName": "lagunaseca",
    "TrackID": 47,
    "TrackLength": "3.57 km",
    "TrackDisplayName": "WeatherTech Raceway Laguna Seca",
    "TrackCity": "Salinas",
    "TrackCountry": "USA",
    "TrackWeatherType": "Static",
    "TrackSkies": "Partly Cloudy",
    "TrackSurfaceTemp": "40.36 C",
    "TrackAirTemp": "26.11 C",
    "TrackAirPressure": "29.16 Hg",
    "TrackWindVel": "0.89 m/s",
    "TrackWindDir": "0.00 rad",
    "TrackRelativeHumidity": "45 %",
    "TrackFogLevel": "0 %",
    "TrackPrecipitation": "0 %",
    "WeekendOptions": {
      "NumStarters": 0,
      "WeatherType": "Static",
      "Skies": "Partly Cloudy",
      "TimeOfDay": "3:06 pm",
      "Date": "2024-05-15T00:00:00.000Z"
    }
  }
}
```

### Nested Field Requests

You can also request nested fields within session info by specifying the path to the field using dot notation.

#### Request Example

```json
{
  "sessionInfo": {
    "requestedFields": [
      "WeekendInfo.TrackName",
      "WeekendInfo.TrackDisplayName",
      "WeekendInfo.BuildVersion",
      "WeekendInfo.WeekendOptions.NumStarters"
    ]
  }
}
```

#### Response Example

```json
{
  "WeekendInfo": {
    "TrackName": "lagunaseca",
    "TrackDisplayName": "WeatherTech Raceway Laguna Seca",
    "BuildVersion": "2024.08.01.01",
    "WeekendOptions": {
      "NumStarters": 0
    }
  }
}
```

### Handling Errors

If the server receives an invalid JSON message or an unrecognized field request, it will respond with an error message.

#### Error Response Example

```json
{
  "error": true,
  "message": "Invalid JSON"
}
```

### Connection Status

The server broadcasts connection status updates to all connected clients whenever the iRacing simulator connects or disconnects.

#### Connected Status Example

```json
{
  "connected": true
}
```

#### Disconnected Status Example

```json
{
  "connected": false
}
```

## Handling Unhandled Exceptions and Rejections

The server is equipped with error handling to catch uncaught exceptions and unhandled promise rejections. If such an error occurs, the server will log the error and terminate the process to prevent further issues.

## Conclusion

The IRSDK WebSocket Server provides a flexible and powerful way to access real-time telemetry and session information from the iRacing simulator. By connecting to the server and sending requests for specific fields, clients can receive the data they need with minimal latency.
