import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AgentClientContextDto } from './agent-client-context.dto';

export class AgentDecisionDto {
  @ApiProperty({
    description: 'Unique identifier of the tool call requiring decision',
    maxLength: 128,
    example: 'call_1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  callId: string;

  @ApiProperty({
    description: 'Whether the action is approved or rejected',
    example: true,
  })
  @IsBoolean()
  approve: boolean;
}

export class ResumeAgentDto {
  @ApiProperty({
    type: [AgentDecisionDto],
    description: 'Decisions for tool calls waiting for human approval',
    minItems: 1,
    maxItems: 12,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => AgentDecisionDto)
  decisions: AgentDecisionDto[];

  @ApiPropertyOptional({
    type: () => AgentClientContextDto,
    description: 'Optional browser client context hints',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentClientContextDto)
  clientContext?: AgentClientContextDto;
}
