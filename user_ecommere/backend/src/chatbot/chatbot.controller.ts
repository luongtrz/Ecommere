import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ChatbotService } from './chatbot.service';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Public()
  @Post('messages')
  @ApiOperation({ summary: 'Send a message to the chatbot assistant' })
  @ApiResponse({ status: 201 })
  async sendMessage(@Body() dto: SendChatbotMessageDto) {
    return this.chatbotService.sendMessage(dto);
  }

  @Public()
  @Delete('sessions/:sessionId/history')
  @ApiOperation({ summary: 'Clear chatbot history for a client session' })
  @ApiResponse({ status: 200 })
  async clearHistory(@Param('sessionId') sessionId: string) {
    return this.chatbotService.clearHistory(sessionId);
  }
}
