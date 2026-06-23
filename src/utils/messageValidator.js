const config = require("../config");


function parseMessage(data) {
  try {
    return JSON.parse(data.toString());
  } catch {
    return null;
  }
}


function sendJsonError(socket, ws) {
  ws.sendRaw(socket, {
    method: "ERROR",
    from: config.serverId,
    error: "Invalid JSON"
  });
}

module.exports = {
  parseMessage,
  sendJsonError
};
