export const getFields = (data: any, fields: string[]): any => {
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

export const getExecutionArguments = () => {
  let PORT = 4000;
  let TELEMETRY_UPDATE_INTERVAL = 4;
  let SESSION_INFO_UPDATE_INTERVAL = 16;

  let prevArgument: string = "";
  process.argv.forEach(function (val) {
    val = val.toLowerCase();
    if (prevArgument === "--port" || prevArgument === "-p") {
      const receivedValue = new Number(val).valueOf();
      if (isNaN(receivedValue))
        throw new Error("[--port / -p] value is not a number");
      if (receivedValue > 65534 || receivedValue < 1)
        throw new Error("[--port / -p] must be in range >= 1 && <= 65534");
      else PORT = Math.floor(receivedValue);
    }
    if (prevArgument === "--telemetry-interval" || prevArgument === "-ti") {
      const receivedValue = new Number(val).valueOf();
      if (isNaN(receivedValue))
        throw new Error("[--telemetry-interval / -ti] value is not a number");
      if (receivedValue < 1)
        throw new Error("[--telemetry-interval / -ti] must be > 0");
      if (receivedValue > 1000) {
        console.warn(
          "NOTICE: [--telemetry-interval / -ti] value is in milliseconds"
        );
      } else TELEMETRY_UPDATE_INTERVAL = Math.floor(receivedValue);
    }
    if (prevArgument === "--session-info-interval" || prevArgument === "-si") {
      const receivedValue = new Number(val).valueOf();
      if (isNaN(receivedValue))
        throw new Error(
          "[--session-info-interval / -si] value is not a number"
        );
      if (receivedValue < 1)
        throw new Error("[--session-info-interval / -si] must be > 0");
      if (receivedValue > 1000) {
        console.warn(
          "NOTICE: [--session-info-interval / -si] value is in milliseconds"
        );
      } else SESSION_INFO_UPDATE_INTERVAL = Math.floor(receivedValue);
    }
    prevArgument = val;
  });

  return {
    PORT,
    TELEMETRY_UPDATE_INTERVAL,
    SESSION_INFO_UPDATE_INTERVAL,
  };
};
