import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

export const NOTIFICATION_QUEUE = 'message.notifications';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private connection: amqp.AmqpConnectionManager;
    private channelWrapper: ChannelWrapper;

    private ready: Promise<void>;
    private resolveReady!: () => void;

    constructor() {
        this.ready = new Promise<void>((resolve) => {
            this.resolveReady = resolve;
        });
    }

    async onModuleInit() {
        const url = process.env.RABBITMQ_URL;
        if (!url) {
            throw new Error('RABBITMQ_URL is not set in environment');
        }

        this.connection = amqp.connect([url]);
        this.channelWrapper = this.connection.createChannel({
            json: true,
            setup: (channel: ConfirmChannel) =>
                channel.assertQueue(NOTIFICATION_QUEUE, { durable: true }),
        });

        this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
        this.connection.on('disconnect', (err) =>
            this.logger.warn('RabbitMQ disconnected', err?.err?.message),
        );

        this.resolveReady();
    }

    async publishNotification(payload: any) {
        await this.ready; // ⬅️ wait until init is done
        return this.channelWrapper.sendToQueue(NOTIFICATION_QUEUE, payload, {
            persistent: true,
        });
    }

    async consumeNotifications(handler: (msg: any) => Promise<void>) {
        await this.ready;
        await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
            await channel.consume(NOTIFICATION_QUEUE, async (msg) => {
                if (!msg) return;
                try {
                    await handler(JSON.parse(msg.content.toString()));
                    channel.ack(msg);
                } catch (err) {
                    this.logger.error('Consumer error', err);
                    channel.nack(msg, false, false);
                }
            });
        });
    }

    async onModuleDestroy() {
        await this.channelWrapper?.close();
        await this.connection?.close();
    }
}