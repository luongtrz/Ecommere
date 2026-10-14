import { createHash } from 'crypto';
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
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
  type AgentTranscriptMessage,
} from './agent/agent.runner';
import { ThreadService, type AgentActor } from './agent/thread.service';
import type { AgentConfig } from './agent/agent.config';
import { SseWriter, type AgentStreamEvent } from './agent/sse.frames';
import type { ToolContext, AgentRole } from './tools/tool.types';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto } from './dtos/agent-resume.dto';
import { AgentThreadQueryDto } from './dtos/agent-thread-query.dto';

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
      ...(body.clientContext ? { clientContext: body.clientContext as any } : {}),
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
  @Get('threads/:threadId/messages')
  @ApiOperation({ summary: 'Get saved messages of a chat thread' })
  @ApiResponse({ status: 200, description: 'The saved messages' })
  @ApiResponse({ status: 404, description: 'Thread not found or not owned' })
  async getMessages(
    @Req() req: Request,
    @Param('threadId') threadId: string,
  ): Promise<AgentTranscriptMessage[]> {
    const actor = this.getActor(req);
    await this.threads.assertOwned(threadId, actor);
    return await this.runner.readTranscript(threadId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Delete('threads/:threadId')
  @ApiOperation({ summary: 'Delete a chat thread' })
  @ApiResponse({ status: 200, description: 'Thread deleted' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  @ApiResponse({ status: 409, description: 'Thread is busy' })
  async deleteThread(
    @Req() req: Request,
    @Param('threadId') threadId: string,
  ) {
    const actor = this.getActor(req);
    await this.threads.assertOwned(threadId, actor);
    if (this.runner.isThreadRunning(threadId)) {
      throw new ConflictException(
        'Cuộc trò chuyện đang được xử lý, vui lòng thử lại sau.',
      );
    }
    await this.runner.deleteCheckpoints(threadId);
    await this.threads.remove(threadId, actor);
    return { deleted: true };
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
    const actor: AgentActor = {
      userId: user?.id ?? null,
      app: 'USER',
    };

    const rawHeader =
      (typeof req.header === 'function' ? req.header('x-chat-session') : undefined) ??
      req.headers?.['x-chat-session'] ??
      req.headers?.['X-Chat-Session'] ??
      (req.headers &&
        Object.entries(req.headers).find(
          ([k]) => k.toLowerCase() === 'x-chat-session',
        )?.[1]);
    const sessionKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (
      typeof sessionKey === 'string' &&
      sessionKey.length >= 16 &&
      sessionKey.length <= 128
    ) {
      actor.sessionKeyHash = createHash('sha256')
        .update(sessionKey)
        .digest('hex');
    }

    return actor;
  }

  private getRole(req: Request): AgentRole {
    const user = (req as any)?.user;
    if (!user) {
      return 'GUEST';
    }
    return user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
  }
}
