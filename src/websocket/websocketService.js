const WebSocket = require("ws");
const config = require("../config");
const { getOnlinePeers } = require("../peerRegistry");
const { handleAuth } = require("../handlers/accountHandler");
const { handlePing, handlePong } = require("../handlers/peerHandler");
const {
  parseMessage,
  sendJsonError
} = require("../utils/messageValidator");
const { generateId } = require("../utils/idGenerator");

class WebSocketService {
  constructor() {
    /*
     * Peer server connections
     *
     * peers:
     *   peerId -> WebSocket
     *
     * socketPeers:
     *   WebSocket -> peerId
     */
    this.peers = new Map();
    this.socketPeers = new WeakMap();
    this.connectingPeers = new Map();
    this.peerHealth = new Map();

    /*
     * Normal user connections
     *
     * userSockets:
     *   userId -> WebSocket
     *
     * socketUsers:
     *   WebSocket -> userId
     */
    this.userSockets = new Map();
    this.socketUsers = new WeakMap();

    /*
     * Admin connections
     *
     * adminSockets:
     *   adminId -> WebSocket
     *
     * socketAdmins:
     *   WebSocket -> adminId
     */
    this.adminSockets = new Map();
    this.socketAdmins = new WeakMap();

    /*
     * Prevent duplicate admin notifications.
     *
     * This is especially useful when servers have multiple peer
     * connections or retry sending the same notification.
     */
    this.seenAdminNotifications = new Set();

    this.heartbeatTimer = null;
  }

  /*
   * Attach this service to the WebSocket server.
   */
  attachWebSocketServer(wss) {
    wss.on("connection", (socket) => {
      socket.on("message", (data) => {
        this.handleMessage(socket, data).catch((error) => {
          console.error(
            "WebSocket message handling error:",
            error.message
          );

          this.sendRaw(socket, {
            method: "ERROR",
            error: "Failed to process WebSocket message"
          });
        });
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

  /*
   * Load all currently online peer servers.
   */
  async loadPeers() {
    const peers = await getOnlinePeers();

    for (const peer of peers) {
      this.connectToPeer(peer.serverId, peer.wsUrl);
    }
  }

  /*
   * Connect to another server using WebSocket.
   */
  connectToPeer(peerId, wsUrl) {
    const normalizedPeerId = String(peerId);

    if (this.peers.has(normalizedPeerId)) {
      return;
    }

    if (this.connectingPeers.has(normalizedPeerId)) {
      return;
    }

    const socket = new WebSocket(wsUrl);

    this.connectingPeers.set(normalizedPeerId, socket);

    socket.on("open", () => {
      this.connectingPeers.delete(normalizedPeerId);

      this.savePeerSocket(normalizedPeerId, socket);

      this.sendRaw(socket, {
        method: "AUTH",
        peer: true,
        msisdn: config.serverId,
        deviceId: config.deviceId
      });

      console.log(`→ Connected to peer: ${normalizedPeerId}`);
    });

    socket.on("message", (data) => {
      this.handleMessage(socket, data).catch((error) => {
        console.error(
          `Peer ${normalizedPeerId} message error:`,
          error.message
        );
      });
    });

    socket.on("close", () => {
      this.connectingPeers.delete(normalizedPeerId);
      this.removeSocket(socket);

      console.log(`← Peer disconnected: ${normalizedPeerId}`);
    });

    socket.on("error", (error) => {
      this.connectingPeers.delete(normalizedPeerId);

      console.error(
        `Peer ${normalizedPeerId} error:`,
        error.message
      );

      this.removeSocket(socket);
    });
  }

  /*
   * Process incoming WebSocket messages.
   */
  async handleMessage(socket, data) {
    const message = parseMessage(data);

    if (!message) {
      sendJsonError(socket, this);
      return;
    }

    console.log("📨 Message:", message.method);

    switch (message.method) {
      case "AUTH":
        await handleAuth(socket, message, this);
        break;

      case "PING":
        await handlePing(socket, message, this);
        break;

      case "PONG":
        await handlePong(socket, message, this);
        break;

      case "ADMIN_NOTIFICATION":
        this.handleAdminNotification(socket, message);
        break;
      case "USER_NOTIFICATION":
        this.handleUserNotification(socket, message);
        break;

      default:
        console.warn(
          "⚠️ Unimplemented WebSocket method:",
          message.method
        );

       
    }
  }

  /*
   * Save or replace a user WebSocket.
   *
   * This implementation allows one active WebSocket per user.
   * Connecting from a new device closes the old connection.
   */
  saveUserSocket(userId, socket) {
    const normalizedUserId = String(userId);

    const previousSocket = this.userSockets.get(normalizedUserId);

    if (
      previousSocket &&
      previousSocket !== socket &&
      previousSocket.readyState === WebSocket.OPEN
    ) {
      previousSocket.close(
        4001,
        "User connected from another socket"
      );
    }

    this.userSockets.set(normalizedUserId, socket);
    this.socketUsers.set(socket, normalizedUserId);

    console.log(`✓ Saved user socket: ${normalizedUserId}`);
  }

  /*
   * Save or replace an admin WebSocket.
   *
   * This implementation allows one active WebSocket per admin.
   */
  saveAdminSocket(adminId, socket) {
    const normalizedAdminId = String(adminId);

    const previousSocket = this.adminSockets.get(normalizedAdminId);

    if (
      previousSocket &&
      previousSocket !== socket &&
      previousSocket.readyState === WebSocket.OPEN
    ) {
      previousSocket.close(
        4001,
        "Admin connected from another socket"
      );
    }

    this.adminSockets.set(normalizedAdminId, socket);
    this.socketAdmins.set(socket, normalizedAdminId);

    console.log(`✓ Saved admin socket: ${normalizedAdminId}`);
  }

  /*
   * Save a peer server WebSocket.
   */
  savePeerSocket(peerId, socket) {
    const normalizedPeerId = String(peerId);

    const previousSocket = this.peers.get(normalizedPeerId);

    if (
      previousSocket &&
      previousSocket !== socket &&
      previousSocket.readyState === WebSocket.OPEN
    ) {
      previousSocket.close(
        4001,
        "Peer connected using another socket"
      );
    }

    this.peers.set(normalizedPeerId, socket);
    this.socketPeers.set(socket, normalizedPeerId);

    if (!this.peerHealth.has(normalizedPeerId)) {
      this.peerHealth.set(normalizedPeerId, {
        missedPongs: 0,
        lastPingAt: null,
        lastPongAt: null
      });
    }

    console.log(`✓ Saved peer socket: ${normalizedPeerId}`);
  }

  /*
   * Remove all mappings related to a WebSocket.
   *
   * Equality checks are important because an old socket may close
   * after a newer socket has already replaced it.
   */
  removeSocket(socket) {
    const peerId = this.socketPeers.get(socket);

    if (peerId) {
      if (this.peers.get(peerId) === socket) {
        this.peers.delete(peerId);
        this.peerHealth.delete(peerId);
      }

      this.socketPeers.delete(socket);

      console.log(`⊗ Removed peer socket: ${peerId}`);
    }

    const userId = this.socketUsers.get(socket);

    if (userId) {
      if (this.userSockets.get(userId) === socket) {
        this.userSockets.delete(userId);
      }

      this.socketUsers.delete(socket);

      console.log(`⊗ Removed user socket: ${userId}`);
    }

    const adminId = this.socketAdmins.get(socket);

    if (adminId) {
      if (this.adminSockets.get(adminId) === socket) {
        this.adminSockets.delete(adminId);
      }

      this.socketAdmins.delete(socket);

      console.log(`⊗ Removed admin socket: ${adminId}`);
    }
  }

  /*
   * Send a message to one user.
   */
  sendToUser(userId, message) {
    const normalizedUserId = String(userId);
    const socket = this.userSockets.get(normalizedUserId);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (socket) {
        this.removeSocket(socket);
      }

      return false;
    }

    return this.sendRaw(socket, {
      ...message,
      from: message.from || config.serverId,
      deliveredBy: config.serverId
    });
  }

  /*
   * Send a message to one admin.
   */
  sendToAdmin(adminId, message) {
    const normalizedAdminId = String(adminId);
    const socket = this.adminSockets.get(normalizedAdminId);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (socket) {
        this.removeSocket(socket);
      }

      return false;
    }

    return this.sendRaw(socket, {
      ...message,
      from: message.from || config.serverId,
      deliveredBy: config.serverId
    });
  }

  /*
   * Send a message to every admin connected to this server.
   */
  broadcastToAdmins(message) {
    let sentCount = 0;

    for (const [adminId, socket] of this.adminSockets.entries()) {
      if (socket.readyState !== WebSocket.OPEN) {
        this.removeSocket(socket);
        continue;
      }

      const sent = this.sendRaw(socket, {
        ...message,
        from: message.from || config.serverId,
        deliveredBy: config.serverId
      });

      if (sent) {
        sentCount++;
      } else {
        console.warn(
          `Failed to send admin notification to: ${adminId}`
        );
      }
    }

    return sentCount;
  }

  /*
   * Send a message to one peer server.
   */
  sendToPeer(peerId, message) {
    const normalizedPeerId = String(peerId);
    const socket = this.peers.get(normalizedPeerId);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (socket) {
        this.removeSocket(socket);
      }

      throw new Error(
        `Peer ${normalizedPeerId} is not connected`
      );
    }

    return this.sendRaw(socket, {
      ...message,
      from: message.from || config.serverId
    });
  }

  /*
   * Send a message to every currently connected peer.
   */
  broadcastToPeers(message) {
    let sentCount = 0;

    for (const [peerId, socket] of this.peers.entries()) {
      if (socket.readyState !== WebSocket.OPEN) {
        this.disconnectPeer(
          peerId,
          "Socket is not open"
        );

        continue;
      }

      const sent = this.sendRaw(socket, {
        ...message,
        from: message.from || config.serverId
      });

      if (sent) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /*
   * Create and publish an admin notification.
   *
   * The notification is:
   *
   * 1. Sent to admins connected to the current server.
   * 2. Sent once to all connected peer servers.
   *
   * Peer servers deliver it to their local admins but do not
   * rebroadcast it to other peers. This prevents infinite loops.
   */
  publishAdminNotification(type, data = {}) {
    if (!type) {
      throw new Error(
        "Admin notification type is required"
      );
    }

    const notificationId = generateId(config.serverId);

    const message = {
      method: "ADMIN_NOTIFICATION",
      notificationId,
      type,
      data,
      originServer: config.serverId,
      from: config.serverId,
      timestamp: Date.now()
    };

    this.rememberAdminNotification(notificationId);

    const localAdminCount = this.broadcastToAdmins(message);
    const peerServerCount = this.broadcastToPeers(message);

    console.log(
      `Admin notification ${notificationId} published: ` +
      `${localAdminCount} local admins, ` +
      `${peerServerCount} peer servers`
    );

    return {
      notificationId,
      localAdminCount,
      peerServerCount
    };
  }

  /*
   * Process an admin notification received from a peer server.
   */
  handleAdminNotification(socket, message) {
    const peerId = this.socketPeers.get(socket);

    /*
     * A normal user or admin socket must not be able to publish
     * server-level admin notifications.
     */
    if (!peerId) {
      console.warn(
        "Rejected ADMIN_NOTIFICATION from a non-peer socket"
      );

      this.sendRaw(socket, {
        method: "ERROR",
        error: "ADMIN_NOTIFICATION is restricted to peer servers"
      });

      return;
    }

    if (!message.notificationId) {
      console.warn(
        `Rejected ADMIN_NOTIFICATION from ${peerId}: missing notificationId`
      );

      return;
    }

    if (!message.type) {
      console.warn(
        `Rejected ADMIN_NOTIFICATION from ${peerId}: missing type`
      );

      return;
    }

    /*
     * Ignore a notification already delivered by this server.
     */
    if (
      this.seenAdminNotifications.has(
        String(message.notificationId)
      )
    ) {
      console.log(
        `Ignored duplicate admin notification: ${message.notificationId}`
      );

      return;
    }

    this.rememberAdminNotification(
      message.notificationId
    );

    /*
     * Deliver only to local admins.
     *
     * Do not call broadcastToPeers() here because that would cause
     * an infinite notification loop between peer servers.
     */
    const localAdminCount = this.broadcastToAdmins({
      method: "ADMIN_NOTIFICATION",
      notificationId: message.notificationId,
      type: message.type,
      data: message.data || {},
      originServer:
        message.originServer ||
        message.from ||
        peerId,
      from:
        message.from ||
        message.originServer ||
        peerId,
      timestamp:
        message.timestamp ||
        Date.now()
    });

    console.log(
      `Admin notification ${message.notificationId} received ` +
      `from peer ${peerId} and delivered to ` +
      `${localAdminCount} local admins`
    );
  }



  handleUserNotification(socket, message) {
    const peerId = this.socketPeers.get(socket);

    if (!peerId) {
      console.warn(
        "Rejected USER_NOTIFICATION from non-peer socket"
      );

      this.sendRaw(socket, {
        method: "ERROR",
        error: "USER_NOTIFICATION is restricted to peer servers"
      });

      return;
    }

    if (!message.userId) {
      console.warn(
        `Rejected USER_NOTIFICATION from ${peerId}: missing userId`
      );

      return;
    }

    if (!message.type) {
      console.warn(
        `Rejected USER_NOTIFICATION from ${peerId}: missing type`
      );

      return;
    }

    const delivered = this.sendToUser(
      message.userId,
      {
        method: "USER_NOTIFICATION",
        notificationId: message.notificationId,
        type: message.type,
        data: message.data || {},
        originServer:
          message.originServer ||
          message.from ||
          peerId,
        timestamp:
          message.timestamp ||
          Date.now()
      }
    );

    if (!delivered) {
      console.log(
        `User ${message.userId} is not connected to this server`
      );
    } else {
      console.log(
        `Notification ${message.notificationId} delivered to user ${message.userId}`
      );
    }

    this.sendRaw(socket, {
      method: "USER_NOTIFICATION_RESULT",
      notificationId: message.notificationId,
      userId: String(message.userId),
      delivered,
      from: config.serverId
    });
  }
  

  /*
   * Store recently processed notification IDs.
   *
   * The set is limited to prevent unlimited memory growth.
   */
  rememberAdminNotification(notificationId) {
    const normalizedId = String(notificationId);

    this.seenAdminNotifications.add(normalizedId);

    const maximumRememberedNotifications = 1000;

    while (
      this.seenAdminNotifications.size >
      maximumRememberedNotifications
    ) {
      const oldestNotificationId =
        this.seenAdminNotifications.values().next().value;

      this.seenAdminNotifications.delete(
        oldestNotificationId
      );
    }
  }


  sendNotificationToRemoteUser(
  peerId,
  userId,
  type,
  data = {}
) {
 if (!peerId) {
      console.warn(
        "Rejected USER_NOTIFICATION from a non-peer socket"
      );

      this.sendRaw(socket, {
        method: "ERROR",
        error: "USER_NOTIFICATION is restricted to peer servers"
      });

      return;
    }


  if (!userId) {
    console.warn(
      "Rejected USER_NOTIFICATION: missing userId"
    );  
    this.sendRaw(socket, {
      method: "ERROR",
      error: "USER_NOTIFICATION requires userId"
    });
  }


  const message = {
    method: "USER_NOTIFICATION",
    notificationId: generateId(config.serverId),
    userId: String(userId),
    type,
    data,
    originServer: config.serverId,
    timestamp: Date.now()
  };

  return this.sendToPeer(peerId, message);
}

  /*
   * Disconnect a peer server.
   */
  disconnectPeer(peerId, reason = "Peer unavailable") {
    const normalizedPeerId = String(peerId);
    const socket = this.peers.get(normalizedPeerId);

    if (socket) {
      this.peers.delete(normalizedPeerId);
      this.peerHealth.delete(normalizedPeerId);
      this.socketPeers.delete(socket);

      try {
        socket.close(4000, reason);
      } catch (error) {
        console.error(
          `Failed to close peer ${normalizedPeerId}:`,
          error.message
        );
      }
    }

    const connectingSocket =
      this.connectingPeers.get(normalizedPeerId);

    if (connectingSocket) {
      this.connectingPeers.delete(normalizedPeerId);

      try {
        connectingSocket.close(4000, reason);
      } catch (error) {
        console.error(
          `Failed to close connecting peer ${normalizedPeerId}:`,
          error.message
        );
      }
    }

    console.log(
      `✗ Peer ${normalizedPeerId} disconnected: ${reason}`
    );
  }

  /*
   * Low-level WebSocket send function.
   */
  sendRaw(socket, message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    let payload;

    try {
      payload = JSON.stringify(message);
    } catch (error) {
      console.error(
        "Failed to serialize WebSocket message:",
        error.message
      );

      return false;
    }

    try {
      socket.send(payload, (error) => {
        if (error) {
          console.error(
            "WebSocket send callback error:",
            error.message
          );

          this.removeSocket(socket);
        }
      });

      return true;
    } catch (error) {
      console.error(
        "WebSocket send error:",
        error.message
      );

      this.removeSocket(socket);

      return false;
    }
  }

  /*
   * Start the server-to-server heartbeat.
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      for (const [peerId, socket] of this.peers.entries()) {
        if (socket.readyState !== WebSocket.OPEN) {
          this.disconnectPeer(
            peerId,
            "Socket is not open"
          );

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
          this.disconnectPeer(
            peerId,
            "Missed 3 PONG responses"
          );

          continue;
        }

        this.peerHealth.set(peerId, health);

        this.sendRaw(socket, {
          method: "PING",
          from: config.serverId,
          timestamp: Date.now()
        });

        console.log(
          `🔔 PING sent to ${peerId} ` +
          `(missed: ${health.missedPongs})`
        );
      }
    }, config.heartbeatIntervalMs);

    /*
     * Allow Node.js to exit naturally when this timer is the only
     * active resource.
     */
    if (
      typeof this.heartbeatTimer.unref === "function"
    ) {
      this.heartbeatTimer.unref();
    }
  }

  /*
   * Stop the heartbeat when shutting down the application.
   */
  stopHeartbeat() {
    if (!this.heartbeatTimer) {
      return;
    }

    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }
}

module.exports = WebSocketService;