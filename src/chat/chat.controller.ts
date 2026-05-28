import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { ViewMessagesDto } from "./dto/view-messages.dto";
import { EditMessageDto } from "./dto/edit-message.dto";
import { MessageIdDto } from "./dto/message-id.dto";
import { MarkConversationReadDto } from "./dto/mark-conversation-read.dto";

@ApiTags("chat")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("sendMessage")
  send(@CurrentUser() user, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(
      user.userId,
      dto.receiverId,
      dto.content,
    );
  }

  @Get("viewMessages")
  view(@CurrentUser() user, @Query() dto: ViewMessagesDto) {
    return this.chatService.viewMessages(
      user.userId,
      dto.withUserId,
      dto.page,
      dto.limit,
    );
  }

  @Get("conversations")
  conversations(@CurrentUser() user) {
    return this.chatService.listConversations(user.userId);
  }

  @Patch("editMessage")
  edit(@CurrentUser() user, @Body() dto: EditMessageDto) {
    return this.chatService.editMessage(
      user.userId,
      dto.messageId,
      dto.content,
    );
  }

  @Delete("deleteMessage")
  delete(@CurrentUser() user, @Body() dto: MessageIdDto) {
    return this.chatService.deleteMessage(user.userId, dto.messageId);
  }

  @Patch("markMessageDelivered")
  delivered(@CurrentUser() user, @Body() dto: MessageIdDto) {
    return this.chatService.markDelivered(user.userId, dto.messageId);
  }

  @Patch("markConversationRead")
  read(@CurrentUser() user, @Body() dto: MarkConversationReadDto) {
    return this.chatService.markConversationRead(user.userId, dto.withUserId);
  }
}
