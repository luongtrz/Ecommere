import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotHistoryService } from './chatbot-history.service';
import { ChatbotRetrievalService } from './chatbot-retrieval.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotHistoryService, ChatbotRetrievalService],
})
export class ChatbotModule {}
