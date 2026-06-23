const config = require("../config");


function handlePing(socket, message, ws) {
  ws.sendRaw(socket, {
    method: "PONG",
    from: config.serverId,
    requestId: message.requestId,
    timestamp: Date.now()
  });
}


function handlePong(socket, message, ws) {
  const peerId = message.from || ws.socketPeers.get(socket);

  if (!peerId) {
    return;
  }

  const health = ws.peerHealth.get(peerId) || {
    missedPongs: 0,
    lastPingAt: null,
    lastPongAt: null
  };

  health.missedPongs = 0;
  health.lastPongAt = Date.now();

  ws.peerHealth.set(peerId, health);

  console.log(`✓ PONG received from ${peerId}`);
}

module.exports = {
  handlePing,
  handlePong
};
