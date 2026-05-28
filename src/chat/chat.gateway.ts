import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { Logger, OnModuleInit } from "@nestjs/common";
import {
  RabbitMQService,
  NotificationPayload,
} from "./rabbitmq/rabbitmq.service";

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private jwt: JwtService,
    private rabbit: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.rabbit.consumeNotifications(async (payload) => {
      if (payload.type !== "NEW_MESSAGE") return;
      this.emitToUser(payload.receiverId, "message:new", payload);
      this.emitToUser(payload.senderId, "message:sent", payload);
    });
  }

  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace("Bearer ", "");
      const payload = await this.jwt.verifyAsync(token);
      const userId = payload.sub;
      socket.data.userId = userId;

      if (!this.onlineUsers.has(userId))
        this.onlineUsers.set(userId, new Set());
      this.onlineUsers.get(userId)!.add(socket.id);

      this.logger.log(`User ${userId} connected via ${socket.id}`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (!userId) return;
    const set = this.onlineUsers.get(userId);
    set?.delete(socket.id);
    if (set && set.size === 0) this.onlineUsers.delete(userId);
  }

  @SubscribeMessage("typing")
  onTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { to: string },
  ) {
    this.emitToUser(data.to, "typing", { from: socket.data.userId });
  }

  private emitToUser(
    userId: string,
    event: string,
    payload: NotificationPayload | Record<string, unknown>,
  ) {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;
    for (const id of sockets) this.server.to(id).emit(event, payload);
  }
}
