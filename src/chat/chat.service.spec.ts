import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { Message, MessageStatus } from './schemas/message.schema';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

describe('ChatService', () => {
    let service: ChatService;
    let messageModel: any;
    let rabbit: { publishNotification: jest.Mock };

    const senderId = '507f1f77bcf86cd799439011';
    const receiverId = '507f1f77bcf86cd799439012';

    beforeEach(async () => {
        messageModel = {
            create: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn(),
        };
        rabbit = { publishNotification: jest.fn().mockResolvedValue(true) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                { provide: getModelToken(Message.name), useValue: messageModel },
                { provide: RabbitMQService, useValue: rabbit },
            ],
        }).compile();

        service = module.get<ChatService>(ChatService);
    });

    describe('sendMessage', () => {
        it('saves the message and publishes a notification', async () => {
            const fakeMessage = {
                _id: 'msg1',
                sender: senderId,
                receiver: receiverId,
                content: 'Hello',
                status: MessageStatus.SENT,
                createdAt: new Date(),
            };
            messageModel.create.mockResolvedValue(fakeMessage);

            const result = await service.sendMessage(senderId, receiverId, 'Hello');

            expect(messageModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'Hello' }),
            );
            expect(rabbit.publishNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'NEW_MESSAGE',
                    senderId,
                    receiverId,
                    content: 'Hello',
                }),
            );
            expect(result).toBe(fakeMessage);
        });
    });

    describe('viewMessages', () => {
        it('returns paginated messages in chronological order', async () => {
            // Mongoose query chain mock
            const messages = [
                { _id: 'm2', content: 'second', createdAt: new Date('2024-01-02') },
                { _id: 'm1', content: 'first', createdAt: new Date('2024-01-01') },
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
            expect(result.items[0]._id).toBe('m1');
            expect(result.items[1]._id).toBe('m2');
        });
    });
});