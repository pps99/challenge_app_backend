// src/chat/chat.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ViewMessagesDto } from './dto/view-messages.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('sendMessage')
    send(@CurrentUser() user, @Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(user.userId, dto.receiverId, dto.content);
    }

    @Get('viewMessages')
    view(@CurrentUser() user, @Query() dto: ViewMessagesDto) {
        return this.chatService.viewMessages(user.userId, dto.withUserId, dto.page, dto.limit);
    }
}