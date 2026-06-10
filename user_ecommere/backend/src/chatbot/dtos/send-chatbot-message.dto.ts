import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({
    description: 'Stable chatbot session id used to load history from Redis',
    example: 'chat_0f5f4fe8-c1e2-43ec-9e2c-85f0f7b52d10',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  sessionId?: string;

  @ApiPropertyOptional({
    type: [ChatbotHistoryMessageDto],
    description: 'Recent conversation history from older clients. New clients should use sessionId instead.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatbotHistoryMessageDto)
  history: ChatbotHistoryMessageDto[] = [];
}
