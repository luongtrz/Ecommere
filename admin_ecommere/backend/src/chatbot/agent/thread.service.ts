import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AgentThread } from '@prisma/client';

export interface AgentActor {
  userId: string | null;
  app: 'USER' | 'ADMIN';
  sessionKeyHash?: string | null;
}

@Injectable()
export class ThreadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AgentActor): Promise<{ id: string }> {
    const id = randomUUID();
    await this.prisma.agentThread.create({
      data: {
        id,
        userId: actor.userId,
        sessionKeyHash: actor.sessionKeyHash ?? null,
        app: actor.app,
      },
    });
    return { id };
  }

  async assertOwned(threadId: string, actor: AgentActor): Promise<AgentThread> {
    const thread = await this.prisma.agentThread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.app !== actor.app) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    if (thread.userId !== null) {
      if (actor.userId !== thread.userId) {
        throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
      }
    } else {
      if (
        actor.userId !== null ||
        !actor.sessionKeyHash ||
        !thread.sessionKeyHash ||
        actor.sessionKeyHash !== thread.sessionKeyHash
      ) {
        throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
      }
    }

    return thread;
  }

  async listForUser(actor: AgentActor, limit: number): Promise<AgentThread[]> {
    if (!actor.userId) {
      return [];
    }

    return this.prisma.agentThread.findMany({
      where: {
        userId: actor.userId,
        app: actor.app,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  async remove(
    threadId: string,
    actor: AgentActor,
    isRunning?: () => boolean,
  ): Promise<void> {
    await this.assertOwned(threadId, actor);
    if (isRunning && isRunning()) {
      throw new ConflictException(
        'Cuộc trò chuyện đang được xử lý, vui lòng thử lại sau.',
      );
    }
    if (isRunning) {
      await this.prisma.$transaction(async (tx) => {
        if (isRunning()) {
          throw new ConflictException(
            'Cuộc trò chuyện đang được xử lý, vui lòng thử lại sau.',
          );
        }
        await tx.agentToolLog.deleteMany({
          where: { threadId },
        });
        await tx.agentThread.delete({
          where: { id: threadId },
        });
      });
    } else {
      await this.prisma.$transaction([
        this.prisma.agentToolLog.deleteMany({
          where: { threadId },
        }),
        this.prisma.agentThread.delete({
          where: { id: threadId },
        }),
      ]);
    }
  }

  async recordUsage(threadId: string, tokens: number): Promise<void> {
    if (typeof tokens !== 'number' || !Number.isFinite(tokens) || tokens <= 0) {
      return;
    }

    await this.prisma.agentThread.update({
      where: { id: threadId },
      data: {
        totalTokens: {
          increment: tokens,
        },
      },
    });
  }

  async setTitleIfEmpty(threadId: string, title: string): Promise<void> {
    const storedTitle = (title ?? '').trim().slice(0, 60);
    await this.prisma.agentThread.updateMany({
      where: {
        id: threadId,
        title: null,
      },
      data: {
        title: storedTitle,
      },
    });
  }
}
