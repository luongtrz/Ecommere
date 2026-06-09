import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const CHATBOT_ROLES = ['user', 'assistant'] as const;

class ChatbotHistoryMessageDto {
  @ApiProperty({ enum: CHATBOT_ROLES })
  @IsString()
  @IsIn(CHATBOT_ROLES)
  role: (typeof CHATBOT_ROLES)[number];

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  content: string;
}

export class SendChatbotMessageDto {
  @ApiProperty({
    description: 'Current user prompt to send to the chatbot provider',
  })
  @IsString()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({
    type: [ChatbotHistoryMessageDto],
    description: 'Recent conversation history without system messages',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatbotHistoryMessageDto)
  history: ChatbotHistoryMessageDto[] = [];
}
