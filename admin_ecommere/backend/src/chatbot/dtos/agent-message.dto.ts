import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AgentClientContextDto } from './agent-client-context.dto';

export class SendAgentMessageDto {
  @ApiProperty({
    description: 'User prompt to send to the agent',
    maxLength: 4000,
    example: 'Recommend a fresh fragrance for summer',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({
    description: 'Agent thread ID for continuing an existing conversation',
    example: '41940989-53e7-4f65-bb02-c94314c4897f',
  })
  @IsOptional()
  @IsUUID('4')
  threadId?: string;

  @ApiPropertyOptional({
    type: () => AgentClientContextDto,
    description: 'Optional browser client context hints',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentClientContextDto)
  clientContext?: AgentClientContextDto;
}
