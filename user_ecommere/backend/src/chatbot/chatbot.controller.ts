import { Body, Controller, Post } from '@nestjs/common';
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
}
