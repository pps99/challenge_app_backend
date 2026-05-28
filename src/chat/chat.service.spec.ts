import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { Message, MessageStatus } from "./schemas/message.schema";
import { RabbitMQService } from "./rabbitmq/rabbitmq.service";
import { User } from "../auth/schemas/user.schema";

describe("ChatService", () => {
  let service: ChatService;
  let messageModel: any;
  let userModel: any;
  let rabbit: { publishNotification: jest.Mock };

  const senderId = "507f1f77bcf86cd799439011";
  const receiverId = "507f1f77bcf86cd799439012";

  beforeEach(async () => {
    messageModel = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
    };
    userModel = {
      exists: jest.fn().mockResolvedValue({ _id: receiverId }),
    };
    rabbit = { publishNotification: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(Message.name), useValue: messageModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: RabbitMQService, useValue: rabbit },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe("sendMessage", () => {
    it("saves the message and publishes a notification", async () => {
      const fakeMessage = {
        _id: "msg1",
        sender: senderId,
        receiver: receiverId,
        content: "Hello",
        status: MessageStatus.SENT,
        createdAt: new Date(),
      };
      messageModel.create.mockResolvedValue(fakeMessage);

      const result = await service.sendMessage(senderId, receiverId, "Hello");

      expect(messageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: "Hello" }),
      );
      expect(rabbit.publishNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "NEW_MESSAGE",
          senderId,
          receiverId,
          content: "Hello",
        }),
      );
      expect(result).toBe(fakeMessage);
    });

    it("rejects self-messages", async () => {
      await expect(
        service.sendMessage(senderId, senderId, "Hello"),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects messages to unknown users", async () => {
      userModel.exists.mockResolvedValue(null);

      await expect(
        service.sendMessage(senderId, receiverId, "Hello"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("viewMessages", () => {
    it("returns paginated messages in chronological order", async () => {
      // Mongoose query chain mock
      const messages = [
        { _id: "m2", content: "second", createdAt: new Date("2024-01-02") },
        { _id: "m1", content: "first", createdAt: new Date("2024-01-01") },
      ];
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      };
      messageModel.find.mockReturnValue(chain);
      messageModel.countDocuments.mockResolvedValue(2);

      const result = await service.viewMessages(senderId, receiverId, 1, 50);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      // service reverses to chronological order
      expect(result.items[0]._id).toBe("m1");
      expect(result.items[1]._id).toBe("m2");
    });
  });

  describe("listConversations", () => {
    it("returns conversation summaries with unread counts", async () => {
      messageModel.aggregate.mockResolvedValue([
        {
          _id: `${senderId}_${receiverId}`,
          lastMessage: { _id: "m2", content: "latest" },
          unreadCount: 3,
        },
      ]);

      const result = await service.listConversations(senderId);

      expect(messageModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual([
        {
          conversationId: `${senderId}_${receiverId}`,
          participantIds: [senderId, receiverId],
          lastMessage: { _id: "m2", content: "latest" },
          unreadCount: 3,
        },
      ]);
    });
  });

  describe("editMessage", () => {
    it("edits only messages sent by the current user", async () => {
      messageModel.findOneAndUpdate.mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        content: "Edited",
        isEdited: true,
      });

      const result = await service.editMessage(
        senderId,
        "507f1f77bcf86cd799439013",
        "Edited",
      );

      expect(messageModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: false }),
        { $set: { content: "Edited", isEdited: true } },
        { new: true },
      );
      expect(result.isEdited).toBe(true);
    });

    it("throws NotFoundException when the message cannot be edited", async () => {
      messageModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.editMessage(senderId, "507f1f77bcf86cd799439013", "Edited"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteMessage", () => {
    it("soft-deletes a message sent by the current user", async () => {
      messageModel.findOne.mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        sender: { toString: () => senderId },
      });
      messageModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await expect(
        service.deleteMessage(senderId, "507f1f77bcf86cd799439013"),
      ).resolves.toEqual({ deleted: true });
      expect(messageModel.updateOne).toHaveBeenCalledWith(
        { _id: "507f1f77bcf86cd799439013" },
        { $set: { isDeleted: true, content: "", isEdited: false } },
      );
    });

    it("rejects deletes from non-senders", async () => {
      messageModel.findOne.mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        sender: { toString: () => receiverId },
      });

      await expect(
        service.deleteMessage(senderId, "507f1f77bcf86cd799439013"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("markDelivered", () => {
    it("marks a received message as delivered", async () => {
      messageModel.findOneAndUpdate.mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        status: MessageStatus.DELIVERED,
      });

      const result = await service.markDelivered(
        receiverId,
        "507f1f77bcf86cd799439013",
      );

      expect(result.status).toBe(MessageStatus.DELIVERED);
    });
  });

  describe("markConversationRead", () => {
    it("marks unread received messages as read", async () => {
      messageModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const result = await service.markConversationRead(receiverId, senderId);

      expect(result).toEqual({ updated: 2 });
      expect(messageModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: `${senderId}_${receiverId}`,
          isDeleted: false,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({ status: MessageStatus.READ }),
        }),
      );
    });
  });
});
