import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessageSchema } from "./schemas/message.schema";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { RabbitMQService } from "./rabbitmq/rabbitmq.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, RabbitMQService],
})
export class ChatModule {}
