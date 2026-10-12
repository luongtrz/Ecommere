import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AgentThread } from '@prisma/client';

export interface AgentActor {
  userId: string | null;
  app: 'USER' | 'ADMIN';
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
        app: actor.app,
      },
    });
    return { id };
  }

  async assertOwned(threadId: string, actor: AgentActor): Promise<AgentThread> {
    const thread = await this.prisma.agentThread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.app !== actor.app || thread.userId !== actor.userId) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
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

  async remove(threadId: string, actor: AgentActor): Promise<void> {
    await this.assertOwned(threadId, actor);
    await this.prisma.agentThread.delete({
      where: { id: threadId },
    });
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
