const WebSocket = require("ws");
const config = require("../config");
const { getOnlinePeers } = require("../peerRegistry");
const { handleAuth } = require("../handlers/accountHandler");
const { handlePing, handlePong } = require("../handlers/peerHandler");
const { parseMessage, sendJsonError } = require("../utils/messageValidator");

class WebSocketService {
  constructor() {
    this.peers = new Map();        
    this.socketPeers = new WeakMap(); 
    this.peerHealth = new Map();
    this.userSockets = new Map();  
    this.socketUsers = new WeakMap(); 
  }

  
  attachWebSocketServer(wss) {
    wss.on("connection", (socket) => {
      socket.on("message", (data) => {
        this.handleMessage(socket, data);
      });

      socket.on("close", () => {
        this.removeSocket(socket);
      });

      socket.on("error", (error) => {
        console.error("WebSocket error:", error.message);
        this.removeSocket(socket);
      });
    });
  }

  
  async loadPeers() {
    const peers = await getOnlinePeers();

    for (const peer of peers) {
      this.connectToPeer(peer.serverId, peer.wsUrl);
    }
  }

  
  connectToPeer(peerId, wsUrl) {
    if (this.peers.has(peerId)) return;

    const socket = new WebSocket(wsUrl);

    socket.on("open", () => {
      this.savePeerSocket(peerId, socket);

      this.sendRaw(socket, {
        method: "AUTH",
        peer: true,
        msisdn: config.serverId,
        deviceId: config.deviceId
      });

      console.log(`→ Connected to peer: ${peerId}`);
    });

    socket.on("message", (data) => {
      this.handleMessage(socket, data);
    });

    socket.on("close", () => {
      this.removeSocket(socket);
      console.log(`← Peer disconnected: ${peerId}`);
    });

    socket.on("error", (error) => {
      console.error(`Peer ${peerId} error:`, error.message);
      this.removeSocket(socket);
    });
  }

  
  handleMessage(socket, data) {
    const message = parseMessage(data);

    if (!message) {
      sendJsonError(socket, this);
      return;
    }

    console.log("📨 Message:", message.method);

    switch (message.method) {
      case "AUTH":
        handleAuth(socket, message, this);
        break;

      case "PING":
        handlePing(socket, message, this);
        break;

      case "PONG":
        handlePong(socket, message, this);
        break;

      default:
        console.warn("⚠️  Unimplemented method:", message.method);
    }
  }

  
  disconnectPeer(peerId, reason = "Peer unavailable") {
    const socket = this.peers.get(peerId);

    if (socket) {
      try {
        socket.close();
      } catch (error) {
        console.error(`✗ Failed to close peer ${peerId}:`, error.message);
      }
    }

    this.peers.delete(peerId);
    this.peerHealth.delete(peerId);

    console.log(`✗ Peer ${peerId} disconnected: ${reason}`);
  }

  
  savePeerSocket(peerId, socket) {
    this.peers.set(peerId, socket);
    this.socketPeers.set(socket, peerId);
    if (!this.peerHealth.has(peerId)) {
      this.peerHealth.set(peerId, {
        missedPongs: 0,
        lastPingAt: null,
        lastPongAt: null
      });
    }
  }

  
  removeSocket(socket) {
    const peerId = this.socketPeers.get(socket);
    if (peerId) {
      this.peers.delete(peerId);
      this.peerHealth.delete(peerId);
      console.log(`⊗ Removed peer socket: ${peerId}`);
    }

    const userId = this.socketUsers.get(socket);
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`⊗ Removed user socket: ${userId}`);
    }
  }

  
  saveUserSocket(userId, socket) {
    this.userSockets.set(userId, socket);
    this.socketUsers.set(socket, userId);
  }

  
  sendToPeer(peerId, message) {
    const socket = this.peers.get(peerId);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error(`Peer ${peerId} is not connected`);
    }

    return this.sendRaw(socket, {
      ...message,
      from: config.serverId
    });
  }

  
  sendToUser(userId, message) {
    const socket = this.userSockets.get(String(userId));

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    return this.sendRaw(socket, {
      ...message,
      from: config.serverId
    });
  }

  
  sendRaw(socket, message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }

  
  startHeartbeat() {
    setInterval(() => {
      for (const [peerId, socket] of this.peers.entries()) {
        if (socket.readyState !== WebSocket.OPEN) {
          this.disconnectPeer(peerId, "Socket is not open");
          continue;
        }

        const health = this.peerHealth.get(peerId) || {
          missedPongs: 0,
          lastPingAt: null,
          lastPongAt: null
        };

        health.missedPongs += 1;
        health.lastPingAt = Date.now();

        if (health.missedPongs >= 3) {
          this.disconnectPeer(peerId, "Missed 3 PONG responses");
          continue;
        }

        this.peerHealth.set(peerId, health);

        this.sendRaw(socket, {
          method: "PING",
          from: config.serverId,
          timestamp: Date.now()
        });

        console.log(`🔔 PING sent to ${peerId} (missed: ${health.missedPongs})`);
      }
    }, config.heartbeatIntervalMs);
  }
}

module.exports = WebSocketService;
