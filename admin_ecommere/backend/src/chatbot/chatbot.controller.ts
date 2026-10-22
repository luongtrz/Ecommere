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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, type ThrottlerGetTrackerFunction } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { AGENT_CONFIG } from './agent/admin.providers';
import {
  AgentRunner,
  AgentBusyError,
  AgentNotPendingError,
  type AgentTranscriptMessage,
} from './agent/agent.runner';
import { ThreadService, type AgentActor } from './agent/thread.service';
import type { AgentConfig } from './agent/agent.config';
import { SseWriter, type AgentStreamEvent } from './agent/sse.frames';
import type { ToolContext } from './tools/tool.types';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto } from './dtos/agent-resume.dto';
import { AgentThreadQueryDto } from './dtos/agent-thread-query.dto';

export const getChatbotTracker: ThrottlerGetTrackerFunction = (
  req: Record<string, any>,
) => {
  return req?.user?.id || req?.user?.sub || req?.ip;
};

@ApiTags('Admin chatbot')
@ApiBearerAuth('JWT-auth')
@Roles(Role.ADMIN)
@Controller('admin/chatbot')
export class AdminChatbotController {
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

  @Throttle({
    default: {
      limit: 20,
      ttl: 60000,
      getTracker: getChatbotTracker,
    },
  })
  @Post('stream')
  @ApiOperation({
    summary: 'Stream assistant responses using Server-Sent Events',
  })
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
      role: 'ADMIN',
      app: 'ADMIN',
      threadId,
      ...(body.clientContext
        ? { clientContext: body.clientContext as any }
        : {}),
    };

    await this.runSseTurn(req, res, {
      ctx,
      message: body.prompt,
    });
  }

  @Throttle({
    default: {
      limit: 20,
      ttl: 60000,
      getTracker: getChatbotTracker,
    },
  })
  @Post('threads/:threadId/resume')
  @ApiOperation({
    summary: 'Resume assistant execution with tool call decisions',
  })
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
      role: 'ADMIN',
      app: 'ADMIN',
      threadId,
    };

    await this.runSseTurn(req, res, {
      ctx,
      resume: { decisions: body.decisions },
    });
  }

  @Get('threads')
  @ApiOperation({ summary: 'List admin chat threads' })
  @ApiResponse({ status: 200, description: 'List of caller threads' })
  async listThreads(@Req() req: Request, @Query() query: AgentThreadQueryDto) {
    const actor = this.getActor(req);
    if (!actor.userId) {
      return [];
    }
    const limit = query?.limit ?? 20;
    return this.threads.listForUser(actor, limit);
  }

  @Get('threads/:threadId')
  @ApiOperation({ summary: 'Get thread details by ID' })
  @ApiResponse({ status: 200, description: 'Thread details' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  async getThread(@Req() req: Request, @Param('threadId') threadId: string) {
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

  @Delete('threads/:threadId')
  @ApiOperation({ summary: 'Delete a chat thread' })
  @ApiResponse({ status: 200, description: 'Thread deleted' })
  @ApiResponse({ status: 404, description: 'Thread not found or unowned' })
  @ApiResponse({ status: 409, description: 'Thread is busy' })
  async deleteThread(@Req() req: Request, @Param('threadId') threadId: string) {
    const actor = this.getActor(req);
    await this.threads.assertOwned(threadId, actor);
    if (this.runner.isThreadRunning(threadId)) {
      throw new ConflictException(
        'Cuộc trò chuyện đang được xử lý, vui lòng thử lại sau.',
      );
    }
    await this.runner.deleteCheckpoints(threadId);
    if (this.runner.isThreadRunning(threadId)) {
      throw new ConflictException(
        'Cuộc trò chuyện đang được xử lý, vui lòng thử lại sau.',
      );
    }
    await this.threads.remove(threadId, actor, () =>
      this.runner.isThreadRunning(threadId),
    );
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

    let isTerminated = false;
    const closeStream = () => {
      if (isTerminated) {
        return;
      }
      isTerminated = true;
      if (writer) {
        try {
          writer.close();
        } catch {
          // ignore
        }
      } else if (
        !res.writableFinished &&
        !(res as any)?.writableEnded &&
        typeof (res as any)?.end === 'function'
      ) {
        try {
          (res as any).end();
        } catch {
          // ignore
        }
      }
    };

    // Listen on the response, not the request: on Node 16+ the request emits
    // 'close' as soon as its body is read, which would cancel the turn at once.
    // The response emits 'close' early only when the client has gone away.
    const abortController = new AbortController();
    const onClose = () => {
      if (!isTerminated && !res.writableFinished) {
        abortController.abort();
        closeStream();
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
          if (
            isTerminated ||
            abortController.signal.aborted ||
            res.writableFinished
          ) {
            return;
          }
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
        res.status(409).json({
          statusCode: 409,
          message: 'Cuộc trò chuyện đang được xử lý',
        });
        return;
      }
      throw err;
    }

    try {
      await runPromise;
    } catch {
      if (
        !isTerminated &&
        !abortController.signal.aborted &&
        !res.writableFinished
      ) {
        const w = getWriter();
        w.send({
          event: 'error',
          data: {
            message: 'Trợ lý tạm thời không phản hồi, vui lòng thử lại sau.',
            code: 'AGENT_ERROR',
          },
        });
      }
    } finally {
      cleanupClose();
      closeStream();
    }
  }

  private getActor(req: Request): AgentActor {
    const user = (req as any)?.user;
    return {
      userId: user?.id ?? null,
      app: 'ADMIN',
    };
  }
}
