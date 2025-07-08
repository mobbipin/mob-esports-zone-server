// Bun WebSocket server for chat and notifications
import { serve, ServerWebSocket } from "bun";
import { verify } from "bun-jwt";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Map of userId to their active sockets
const userSockets = new Map<string, Set<ServerWebSocket<undefined>>>();

// Helper: verify JWT and return user info or null
async function verifyJWT(token: string): Promise<{ id: string; role: string; email: string } | null> {
  try {
    const payload = await verify(token, JWT_SECRET);
    if (payload && typeof payload === "object" && payload.id) {
      return payload as any;
    }
    return null;
  } catch {
    return null;
  }
}

serve({
  port: 8788,
  async fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      // Get JWT from header or query param
      const authHeader = req.headers.get("Authorization");
      let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
      if (!token) token = url.searchParams.get("token") || undefined;
      if (!token) return new Response("Missing token", { status: 401 });
      const user = await verifyJWT(token);
      if (!user) return new Response("Invalid token", { status: 401 });
      // Attach user info to socket via upgrade
      if (server.upgrade(req, { data: user })) {
        return;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return new Response("WebSocket server for chat/notifications", { status: 200 });
  },
  websocket: {
    open(ws: ServerWebSocket<any>) {
      const userId = ws.data.id;
      if (!userId) {
        ws.close(4001, "Unauthorized");
        return;
      }
      // Track this socket for the user
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId)!.add(ws);
      ws.subscribe(userId); // Subscribe to their own channel for direct notifications
      ws.send(JSON.stringify({ type: "welcome", message: `Connected as ${userId}` }));
    },
    message(ws: ServerWebSocket<any>, raw) {
      let msg: any;
      try {
        msg = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }
      if (!msg.type) {
        ws.send(JSON.stringify({ type: "error", message: "Missing type field" }));
        return;
      }
      // Message routing skeleton
      switch (msg.type) {
        case "chat:send":
          // { type: 'chat:send', to: userId or roomId, text: string }
          // If to is a userId, send direct. If to is a roomId, broadcast.
          if (msg.to && msg.text) {
            if (userSockets.has(msg.to)) {
              // Direct message
              for (const sock of userSockets.get(msg.to)!) {
                sock.send(JSON.stringify({ type: "chat:message", from: ws.data.id, text: msg.text }));
              }
            } else {
              // Broadcast to room
              ws.publish(msg.to, JSON.stringify({ type: "chat:message", from: ws.data.id, text: msg.text }));
            }
          }
          break;
        case "notification:send":
          // { type: 'notification:send', to: userId, notification: {...} }
          if (msg.to && msg.notification && userSockets.has(msg.to)) {
            for (const sock of userSockets.get(msg.to)!) {
              sock.send(JSON.stringify({ type: "notification", notification: msg.notification }));
            }
          }
          break;
        // Add more message types as needed
        default:
          ws.send(JSON.stringify({ type: "error", message: `Unknown type: ${msg.type}` }));
      }
    },
    close(ws: ServerWebSocket<any>) {
      const userId = ws.data.id;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId)!.delete(ws);
        if (userSockets.get(userId)!.size === 0) userSockets.delete(userId);
      }
    },
    drain(ws: ServerWebSocket<any>) {},
  },
});

console.log("Bun WebSocket server with JWT auth running on ws://localhost:8788/ws"); 