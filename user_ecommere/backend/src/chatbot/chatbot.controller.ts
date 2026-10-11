import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ChatbotService } from './chatbot.service';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';
import { ChatbotSessionIdPipe } from './pipes/chatbot-session-id.pipe';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to the chatbot assistant' })
  @ApiResponse({ status: 201 })
  async sendMessage(
    @Body() dto: SendChatbotMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatbotService.sendMessage(userId, dto);
  }

  @Delete('sessions/:sessionId/history')
  @ApiOperation({ summary: 'Clear chatbot history for a client session' })
  @ApiResponse({ status: 200 })
  async clearHistory(
    @CurrentUser('id') userId: string,
    @Param('sessionId', new ChatbotSessionIdPipe()) sessionId: string,
  ) {
    return this.chatbotService.clearHistory(userId, sessionId);
  }
}
