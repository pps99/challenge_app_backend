import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageStatus } from './schemas/message.schema';
import { makeConversationId } from './utils/conversation-id';
import { RabbitMQService, NotificationPayload } from './rabbitmq/rabbitmq.service';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        private rabbit: RabbitMQService,
    ) { }

    async sendMessage(senderId: string, receiverId: string, content: string) {
        const conversationId = makeConversationId(senderId, receiverId);
        const message = await this.messageModel.create({
            sender: new Types.ObjectId(senderId),
            receiver: new Types.ObjectId(receiverId),
            content,
            conversationId,
            status: MessageStatus.SENT,
        });

        const notification: NotificationPayload = {
            type: 'NEW_MESSAGE',
            messageId: message._id.toString(),
            senderId,
            receiverId,
            content,
            conversationId,
            createdAt: message.createdAt,
        };
        await this.rabbit.publishNotification(notification);

        return message;
    }

    async viewMessages(userId: string, otherUserId: string, page = 1, limit = 50) {
        const conversationId = makeConversationId(userId, otherUserId);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.messageModel
                .find({ conversationId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.messageModel.countDocuments({ conversationId }),
        ]);
        return { items: items.reverse(), total, page, limit };
    }
}