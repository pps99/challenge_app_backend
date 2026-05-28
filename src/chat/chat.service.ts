import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Message,
  MessageDocument,
  MessageStatus,
} from "./schemas/message.schema";
import { makeConversationId } from "./utils/conversation-id";
import {
  RabbitMQService,
  NotificationPayload,
} from "./rabbitmq/rabbitmq.service";
import { User, UserDocument } from "../auth/schemas/user.schema";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private rabbit: RabbitMQService,
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) {
      throw new BadRequestException("Cannot send a message to yourself");
    }

    const receiverExists = await this.userModel.exists({
      _id: new Types.ObjectId(receiverId),
    });
    if (!receiverExists) throw new NotFoundException("Receiver not found");

    const conversationId = makeConversationId(senderId, receiverId);
    const message = await this.messageModel.create({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      content,
      conversationId,
      status: MessageStatus.SENT,
    });

    const notification: NotificationPayload = {
      type: "NEW_MESSAGE",
      messageId: message._id.toString(),
      senderId,
      receiverId,
      content,
      conversationId,
      createdAt: message.createdAt,
    };
    this.rabbit.publishNotification(notification).catch((err) => {
      this.logger.warn(`Message notification publish failed: ${err.message}`);
    });

    return message;
  }

  async viewMessages(
    userId: string,
    otherUserId: string,
    page = 1,
    limit = 50,
  ) {
    const conversationId = makeConversationId(userId, otherUserId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.messageModel
        .find({ conversationId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.messageModel.countDocuments({ conversationId, isDeleted: false }),
    ]);
    return { items: items.reverse(), total, page, limit };
  }

  async listConversations(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const rows = await this.messageModel.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userObjectId] },
                    { $ne: ["$status", MessageStatus.READ] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    return rows.map((row) => ({
      conversationId: row._id,
      participantIds: row._id.split("_"),
      lastMessage: row.lastMessage,
      unreadCount: row.unreadCount,
    }));
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.messageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(messageId),
        sender: new Types.ObjectId(userId),
        isDeleted: false,
      },
      { $set: { content, isEdited: true } },
      { new: true },
    );
    if (!message)
      throw new NotFoundException("Message not found or not editable");
    return message;
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.messageModel.findOne({
      _id: new Types.ObjectId(messageId),
      isDeleted: false,
    });
    if (!message) throw new NotFoundException("Message not found");
    if (message.sender.toString() !== userId) {
      throw new ForbiddenException("Only the sender can delete this message");
    }

    await this.messageModel.updateOne(
      { _id: message._id },
      { $set: { isDeleted: true, content: "", isEdited: false } },
    );
    return { deleted: true };
  }

  async markDelivered(userId: string, messageId: string) {
    const message = await this.messageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(messageId),
        receiver: new Types.ObjectId(userId),
        status: MessageStatus.SENT,
        isDeleted: false,
      },
      { $set: { status: MessageStatus.DELIVERED } },
      { new: true },
    );
    if (!message)
      throw new NotFoundException("Message not found or already delivered");
    return message;
  }

  async markConversationRead(userId: string, otherUserId: string) {
    const conversationId = makeConversationId(userId, otherUserId);
    const result = await this.messageModel.updateMany(
      {
        conversationId,
        receiver: new Types.ObjectId(userId),
        status: { $ne: MessageStatus.READ },
        isDeleted: false,
      },
      { $set: { status: MessageStatus.READ, readAt: new Date() } },
    );

    return { updated: result.modifiedCount };
  }
}
