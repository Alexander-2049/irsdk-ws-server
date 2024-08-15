# WebSocket API Documentation

This WebSocket server provides real-time access to iRacing data. Clients can request specific fields for updates, control the frequency of data transmission, and receive connection status updates.

## Table of Contents

- [Connection](#connection)
- [Requests](#requests)
  - [Request Specific Data Fields](#request-specific-data-fields)
  - [Immediate Data Update](#immediate-data-update)
  - [Retrieve All Data](#retrieve-all-data)
- [Response Examples](#response-examples)
- [Error Handling](#error-handling)

## Connection

Clients connect to the WebSocket server at:
```
ws://localhost:8080
```

Once connected, the client will immediately receive the iRacing connection status as follows:
```json
{ "connected": true | false }
```

## Requests

### 1. Request Specific Data Fields

Clients can request specific fields from either `sessionInfo`, `telemetry`, or `telemetryDescription`. They can also specify how frequently they want to receive updates. The `sendInterval` must be set to `20ms` or higher.

- **Request Session Info Fields**  
  Example message to request specific session info fields:
  ```json
  {
    "sessionInfo": {
      "requestedFields": ["DriverInfo", "SessionTime"],
      "sendInterval": 500
    }
  }
  ```

- **Request Telemetry Fields**  
  Example message to request specific telemetry fields:
  ```json
  {
    "telemetry": {
      "requestedFields": ["Speed", "RPM"],
      "sendInterval": 100
    }
  }
  ```

- **Request Telemetry Description Fields**  
  Example message to request specific telemetry description fields:
  ```json
  {
    "telemetryDescription": {
      "requestedFields": ["Chassis", "CarSetup"],
      "sendInterval": 1000
    }
  }
  ```

### 2. Immediate Data Update

Clients can request an immediate update of the currently requested fields without specifying an interval. This request provides a one-time snapshot of the requested data.

- **Request Immediate Update**  
  Example message to request immediate update:
  ```json
  {
    "update": true
  }
  ```

### 3. Retrieve All Data

Clients can request to retrieve all available data for `sessionInfo`, `telemetry`, and `telemetryDescription` in a single request.

- **Request All Available Data**  
  Example message to retrieve all data:
  ```json
  {
    "getAll": true
  }
  ```

## Response Examples

The WebSocket server responds with the requested data in real-time, depending on the fields and intervals specified. Below are examples of responses that clients might receive.

- **Connection Status**  
  Sent automatically upon connection or when iRacing's status changes:
  ```json
  { "connected": true }
  ```

- **Requested Session Info Data**  
  Response when session info data is sent based on the requested fields:
  ```json
  {
    "sessionInfo": {
      "DriverInfo": { /* driver info data */ },
      "SessionTime": 1203.57
    }
  }
  ```

- **Requested Telemetry Data**  
  Response when telemetry data is sent based on the requested fields:
  ```json
  {
    "telemetry": {
      "Speed": 155.8,
      "RPM": 6700
    }
  }
  ```

- **Requested Telemetry Description Data**  
  Response when telemetry description data is sent based on the requested fields:
  ```json
  {
    "telemetryDescription": {
      "Chassis": { /* chassis data */ },
      "CarSetup": { /* car setup data */ }
    }
  }
  ```

- **Full Data Update**  
  Response when a full data update is requested:
  ```json
  {
    "sessionInfo": { /* full session info */ },
    "telemetry": { /* full telemetry data */ },
    "telemetryDescription": { /* full telemetry description */ }
  }
  ```

## Error Handling

In case the client sends invalid JSON data, the server responds with the following error message:
```json
{
  "error": true,
  "message": "Invalid JSON",
}
```

If the client attempts to set an interval lower than `20ms`, the server automatically stops sending updates for that data type (interval will be treated as `0`).

```json
{
  "telemetry": {
    "sendInterval": 0
  }
}
```
