const crypto = require("node:crypto");
const http = require("node:http");

function encodeFrame(payload) {
  const data = Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload), "utf8");
  if (data.length < 126) {
    return Buffer.concat([Buffer.from([0x81, data.length]), data]);
  }
  if (data.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
    return Buffer.concat([header, data]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(data.length), 2);
  return Buffer.concat([header, data]);
}

class RuntimeWebSocketServer {
  constructor({ host = "127.0.0.1", port = 0, auth = null } = {}) {
    this.host = host;
    this.port = port;
    this.auth = auth;
    this.server = null;
    this.clients = new Map();
    this.started = false;
  }

  start() {
    return new Promise((resolve) => {
      this.server = http.createServer((request, response) => {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({
          status: "runtime-websocket-server-ready",
          readonly: true,
          websocketPath: "/runtime-stream"
        }));
      });

      this.server.on("upgrade", (request, socket) => {
        const url = new URL(request.url, `http://${request.headers.host || `${this.host}:${this.port}`}`);
        const authorization = this.auth?.authorize({
          token: url.searchParams.get("token"),
          command: "subscribe",
          headers: request.headers
        }) || { authorized: true };
        if (!authorization.authorized) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }

        const key = request.headers["sec-websocket-key"];
        if (!key) {
          socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
          socket.destroy();
          return;
        }
        const accept = crypto
          .createHash("sha1")
          .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
          .digest("base64");
        socket.write([
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${accept}`,
          "\r\n"
        ].join("\r\n"));

        const clientId = `ws_client_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
        this.clients.set(clientId, {
          clientId,
          socket,
          connectedAt: new Date().toISOString(),
          readonly: true
        });
        socket.on("close", () => this.clients.delete(clientId));
        socket.on("error", () => this.clients.delete(clientId));
        this.send(clientId, {
          type: "stream.connected",
          source: "runtime-websocket-server",
          clientId,
          readonly: true,
          safetyMode: "readonly-safe-websocket"
        });
      });

      this.server.listen(this.port, this.host, () => {
        const address = this.server.address();
        this.port = address.port;
        this.started = true;
        resolve({
          started: true,
          host: this.host,
          port: this.port,
          url: `ws://${this.host}:${this.port}/runtime-stream`,
          localOnly: true,
          readonly: true,
          safetyMode: "readonly-safe-local-websocket"
        });
      });
    });
  }

  send(clientId, event) {
    const client = this.clients.get(clientId);
    if (!client) {
      return { delivered: false, reason: "client-not-found" };
    }
    try {
      client.socket.write(encodeFrame(event));
      return { delivered: true, clientId, eventType: event.type };
    } catch (error) {
      return { delivered: false, clientId, reason: error.message };
    }
  }

  broadcast(event) {
    return [...this.clients.keys()].map((clientId) => this.send(clientId, event));
  }

  snapshotFallback(events = [], reason = "websocket-unavailable") {
    return {
      mode: "snapshot",
      reason,
      eventCount: events.length,
      events,
      readonly: true,
      safetyMode: "readonly-safe-stream-snapshot"
    };
  }

  stop() {
    for (const client of this.clients.values()) {
      client.socket.destroy();
    }
    this.clients.clear();
    if (!this.server) {
      return Promise.resolve({ stopped: true, reason: "server-not-started" });
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) {
          return;
        }
        settled = true;
        this.started = false;
        this.server = null;
        resolve(result);
      };

      if (typeof this.server.closeAllConnections === "function") {
        this.server.closeAllConnections();
      }
      const timeout = setTimeout(() => {
        finish({
          stopped: true,
          readonly: true,
          forced: true,
          reason: "websocket-server-close-timeout"
        });
      }, 1_000);
      timeout.unref?.();
      this.server.close(() => {
        clearTimeout(timeout);
        finish({ stopped: true, readonly: true });
      });
    });
  }
}

module.exports = {
  RuntimeWebSocketServer,
  encodeFrame
};
