import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from './guards/optional-jwt.guard';
import { AGENT_CONFIG } from './agent/agent.providers';
import {
  AgentRunner,
  AgentBusyError,
  AgentNotPendingError,
} from './agent/agent.runner';
import { ThreadService, type AgentActor } from './agent/thread.service';
import type { AgentConfig } from './agent/agent.config';
import { SseWriter, type AgentStreamEvent } from './agent/sse.frames';
import type { ToolContext, AgentRole } from './tools/tool.types';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto } from './dtos/agent-resume.dto';
import { AgentThreadQueryDto } from './dtos/agent-thread-query.dto';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidV4(val?: string): boolean {
  return typeof val === 'string' && UUID_V4_REGEX.test(val);
}

@ApiTags('Chatbot')
@ApiBearerAuth('JWT-auth')
@UseGuards(OptionalJwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  private readonly config: AgentConfig;
  private readonly runner: AgentRunner;
  private readonly threads: ThreadService;

  constructor(
    @Inject(AGENT_CONFIG) config: AgentConfig,
    runner: AgentRunner,
    threads: ThreadService,
  ) {
    this.config = config;
    this.runner = runner;
    this.threads = threads;
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('stream')
  @ApiOperation({ summary: 'Stream assistant responses using Server-Sent Events' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  @ApiResponse({ status: 409, description: 'Thread is busy' })
  @ApiResponse({ status: 503, description: 'Assistant is not configured' })
  async stream(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SendAgentMessageDto,
  ): Promise<void> {
    if (!this.config?.apiKey) {
      res
        .status(503)
        .json({ statusCode: 503, message: 'Trợ lý chưa được cấu hình' });
      return;
    }

    const actor = this.getActor(req);
    const role = this.getRole(req);

    let threadId: string;
    if (body.threadId) {
      await this.threads.assertOwned(body.threadId, actor);
      threadId = body.threadId;
    } else {
      const created = await this.threads.create(actor);
      threadId = created.id;
    }

    const ctx: ToolContext = {
      userId: actor.userId,
      role,
      app: 'USER',
      threadId,
      ...(body.clientContext ? { clientContext: body.clientContext as any } : {}),
    };

    await this.runSseTurn(req, res, {
      ctx,
      message: body.prompt,
    });
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('threads/:threadId/resume')
  @ApiOperation({ summary: 'Resume assistant execution with tool call decisions' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  @ApiResponse({ status: 409, description: 'Thread is busy' })
  @ApiResponse({ status: 503, description: 'Assistant is not configured' })
  async resume(
    @Req() req: Request,
    @Res() res: Response,
    @Param('threadId') threadId: string,
    @Body() body: ResumeAgentDto,
  ): Promise<void> {
    if (!this.config?.apiKey) {
      res
        .status(503)
        .json({ statusCode: 503, message: 'Trợ lý chưa được cấu hình' });
      return;
    }

    const actor = this.getActor(req);
    const role = this.getRole(req);

    await this.threads.assertOwned(threadId, actor);

    try {
      await this.runner.assertResumable(
        threadId,
        body.decisions.map((d) => d.callId),
      );
    } catch (err: any) {
      if (
        err instanceof AgentNotPendingError ||
        err?.name === 'AgentNotPendingError'
      ) {
        res.status(409).json({
          statusCode: 409,
          message: 'Không có thao tác nào đang chờ xác nhận',
        });
        return;
      }
      throw err;
    }

    const ctx: ToolContext = {
      userId: actor.userId,
      role,
      app: 'USER',
      threadId,
    };

    await this.runSseTurn(req, res, {
      ctx,
      resume: { decisions: body.decisions },
    });
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('threads')
  @ApiOperation({ summary: 'List user chat threads' })
  @ApiResponse({ status: 200, description: 'List of caller threads' })
  async listThreads(
    @Req() req: Request,
    @Query() query: AgentThreadQueryDto,
  ) {
    const actor = this.getActor(req);
    if (!actor.userId) {
      return [];
    }
    const limit = query?.limit ?? 20;
    return this.threads.listForUser(actor, limit);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('threads/:threadId')
  @ApiOperation({ summary: 'Get thread details by ID' })
  @ApiResponse({ status: 200, description: 'Thread details' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  async getThread(
    @Req() req: Request,
    @Param('threadId') threadId: string,
  ) {
    const actor = this.getActor(req);
    const thread = await this.threads.assertOwned(threadId, actor);
    return {
      id: thread.id,
      title: thread.title,
      app: thread.app,
      totalTokens: thread.totalTokens,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Delete('threads/:threadId')
  @ApiOperation({ summary: 'Delete a chat thread' })
  @ApiResponse({ status: 200, description: 'Thread deleted' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  async deleteThread(
    @Req() req: Request,
    @Param('threadId') threadId: string,
  ) {
    const actor = this.getActor(req);
    await this.threads.assertOwned(threadId, actor);
    await this.runner.deleteCheckpoints(threadId);
    await this.threads.remove(threadId, actor);
    return { deleted: true };
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('messages')
  @ApiOperation({ summary: 'Send message to assistant (legacy compatibility endpoint)' })
  @ApiResponse({ status: 200, description: 'Chatbot response' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  @ApiResponse({ status: 502, description: 'Assistant error' })
  @ApiResponse({ status: 503, description: 'Assistant is not configured' })
  async sendMessage(
    @Req() req: Request,
    @Body() dto: SendChatbotMessageDto,
  ) {
    if (!this.config?.apiKey) {
      throw new HttpException(
        { statusCode: 503, message: 'Trợ lý chưa được cấu hình' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const actor = this.getActor(req);
    const role = this.getRole(req);

    let threadId: string;
    if (isUuidV4(dto.sessionId) && dto.sessionId) {
      await this.threads.assertOwned(dto.sessionId, actor);
      threadId = dto.sessionId;
    } else {
      const created = await this.threads.create(actor);
      threadId = created.id;
    }

    const ctx: ToolContext = {
      userId: actor.userId,
      role,
      app: 'USER',
      threadId,
    };

    let text = '';
    let sources: Array<Record<string, unknown>> | null = null;
    let doneUsage: Record<string, number> | null = null;
    let pendingConfirm: Array<{ id: string; name: string; summary: string; risk: string }> | null = null;
    let errorEvent: { message: string; code: string } | null = null;

    try {
      await this.runner.run({
        ctx,
        message: dto.prompt,
        sink: (event: AgentStreamEvent) => {
          if (event.event === 'token') {
            text += event.data.text;
          } else if (event.event === 'sources') {
            sources = event.data;
          } else if (event.event === 'done') {
            doneUsage = event.data.usage;
          } else if (event.event === 'confirm_required') {
            pendingConfirm = event.data.calls;
          } else if (event.event === 'error') {
            errorEvent = event.data;
          }
        },
      });
    } catch (err: any) {
      if (err instanceof AgentBusyError || err?.name === 'AgentBusyError') {
        throw new HttpException(
          { statusCode: 409, message: 'Cuộc trò chuyện đang được xử lý' },
          HttpStatus.CONFLICT,
        );
      }
      if (!errorEvent) {
        errorEvent = {
          message:
            err?.message ||
            'Trợ lý tạm thời không phản hồi, vui lòng thử lại sau.',
          code: 'AGENT_ERROR',
        };
      }
    }

    if (errorEvent) {
      throw new HttpException(
        { statusCode: 502, message: errorEvent.message },
        HttpStatus.BAD_GATEWAY,
      );
    }

    const response: {
      message: string;
      model: string;
      usage: Record<string, number> | null;
      sessionId: string;
      sources: Array<Record<string, unknown>>;
      pendingConfirm?: Array<{ id: string; name: string; summary: string; risk: string }>;
    } = {
      message: text,
      model: this.config.model,
      usage: doneUsage ?? null,
      sessionId: threadId,
      sources: sources ?? [],
    };

    if (pendingConfirm) {
      response.message = 'Cần xác nhận thao tác trước khi tiếp tục.';
      response.pendingConfirm = pendingConfirm;
    }

    return response;
  }

  private async runSseTurn(
    req: Request,
    res: Response,
    options: {
      ctx: ToolContext;
      message?: string;
      resume?: { decisions: Array<{ callId: string; approve: boolean }> };
    },
  ): Promise<void> {
    let writer: SseWriter | null = null;
    const getWriter = (): SseWriter => {
      if (!writer) {
        writer = new SseWriter(res as any);
        writer.start();
      }
      return writer;
    };

    // Listen on the response, not the request: on Node 16+ the request emits
    // 'close' as soon as its body is read, which would cancel the turn at once.
    // The response emits 'close' early only when the client has gone away.
    const abortController = new AbortController();
    const onClose = () => {
      if (!res.writableFinished) {
        abortController.abort();
      }
    };
    res.on('close', onClose);

    const cleanupClose = () => {
      res.removeListener('close', onClose);
    };

    let runPromise: Promise<void>;
    try {
      runPromise = this.runner.run({
        ctx: options.ctx,
        message: options.message,
        resume: options.resume,
        sink: (event: AgentStreamEvent) => {
          const w = getWriter();
          w.send(event);
        },
        signal: abortController.signal,
      });
    } catch (err: any) {
      cleanupClose();
      if (
        (err instanceof AgentBusyError || err?.name === 'AgentBusyError') &&
        !writer
      ) {
        res
          .status(409)
          .json({ statusCode: 409, message: 'Cuộc trò chuyện đang được xử lý' });
        return;
      }
      throw err;
    }

    try {
      await runPromise;
    } catch {
      const w = getWriter();
      w.send({
        event: 'error',
        data: {
          message: 'Trợ lý tạm thời không phản hồi, vui lòng thử lại sau.',
          code: 'AGENT_ERROR',
        },
      });
    } finally {
      cleanupClose();
      if (writer) {
        writer.close();
      } else if (typeof (res as any)?.end === 'function') {
        (res as any).end();
      }
    }
  }

  private getActor(req: Request): AgentActor {
    const user = (req as any)?.user;
    return {
      userId: user?.id ?? null,
      app: 'USER',
    };
  }

  private getRole(req: Request): AgentRole {
    const user = (req as any)?.user;
    if (!user) {
      return 'GUEST';
    }
    return user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
  }
}
