import { describe, expect, it } from 'vitest';
import * as chatbotTypes from './types';
import type {
  ChatConfirmCall,
  ChatMessage,
  ChatRole,
  ChatSource,
  ChatToolStep,
} from './types';

describe('chatbot types', () => {
  it('loads the module without runtime errors', () => {
    expect(chatbotTypes).toBeDefined();
  });

  describe('ChatRole', () => {
    it('supports all valid chat roles', () => {
      const roles: ChatRole[] = ['user', 'assistant', 'system'];
      expect(roles).toEqual(['user', 'assistant', 'system']);
    });
  });

  describe('ChatToolStep', () => {
    it('supports valid ChatToolStep without optional fields', () => {
      const step: ChatToolStep = {
        id: 'step-1',
        name: 'search_products',
        summary: 'Tìm kiếm sản phẩm',
        status: 'running',
      };

      expect(step.id).toBe('step-1');
      expect(step.name).toBe('search_products');
      expect(step.summary).toBe('Tìm kiếm sản phẩm');
      expect(step.status).toBe('running');
      expect(step.resultSummary).toBeUndefined();
    });

    it('supports valid ChatToolStep with resultSummary and different statuses', () => {
      const okStep: ChatToolStep = {
        id: 'step-2',
        name: 'check_inventory',
        summary: 'Kiểm tra tồn kho',
        status: 'ok',
        resultSummary: 'Còn 5 sản phẩm',
      };
      const errorStep: ChatToolStep = {
        id: 'step-3',
        name: 'apply_coupon',
        summary: 'Áp dụng mã giảm giá',
        status: 'error',
        resultSummary: 'Mã không hợp lệ',
      };

      expect(okStep.status).toBe('ok');
      expect(okStep.resultSummary).toBe('Còn 5 sản phẩm');
      expect(errorStep.status).toBe('error');
      expect(errorStep.resultSummary).toBe('Mã không hợp lệ');
    });
  });

  describe('ChatConfirmCall', () => {
    it('supports all risk levels in ChatConfirmCall', () => {
      const writeCall: ChatConfirmCall = {
        id: 'call-1',
        name: 'create_order',
        summary: 'Tạo đơn hàng mới',
        risk: 'WRITE',
      };
      const sensitiveCall: ChatConfirmCall = {
        id: 'call-2',
        name: 'view_payment_details',
        summary: 'Xem chi tiết thanh toán',
        risk: 'SENSITIVE',
      };
      const destructiveCall: ChatConfirmCall = {
        id: 'call-3',
        name: 'cancel_order',
        summary: 'Hủy đơn hàng',
        risk: 'DESTRUCTIVE',
      };

      expect(writeCall.risk).toBe('WRITE');
      expect(sensitiveCall.risk).toBe('SENSITIVE');
      expect(destructiveCall.risk).toBe('DESTRUCTIVE');
    });
  });

  describe('ChatSource', () => {
    it('supports ChatSource with and without optional score', () => {
      const sourceWithoutScore: ChatSource = {
        id: 'src-1',
        name: 'Chính sách đổi trả',
        slug: 'return-policy',
      };
      const sourceWithScore: ChatSource = {
        id: 'src-2',
        name: 'Hướng dẫn mua hàng',
        slug: 'shopping-guide',
        score: 0.95,
      };

      expect(sourceWithoutScore.score).toBeUndefined();
      expect(sourceWithScore.score).toBe(0.95);
      expect(sourceWithScore.name).toBe('Hướng dẫn mua hàng');
    });
  });

  describe('ChatMessage', () => {
    it('supports minimal ChatMessage with required fields only', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Xin chào',
        tools: [],
        createdAt: '2026-10-21T00:00:00.000Z',
      };

      expect(message.id).toBe('msg-1');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Xin chào');
      expect(message.tools).toEqual([]);
      expect(message.createdAt).toBe('2026-10-21T00:00:00.000Z');
      expect(message.confirm).toBeUndefined();
      expect(message.sources).toBeUndefined();
      expect(message.error).toBeUndefined();
    });

    it('supports full ChatMessage with all optional fields and relations', () => {
      const toolStep: ChatToolStep = {
        id: 'step-1',
        name: 'search',
        summary: 'Tìm kiếm',
        status: 'ok',
      };
      const confirmCall: ChatConfirmCall = {
        id: 'call-1',
        name: 'checkout',
        summary: 'Thanh toán giỏ hàng',
        risk: 'WRITE',
      };
      const source: ChatSource = {
        id: 'src-1',
        name: 'Tài liệu hỗ trợ',
        slug: 'support-docs',
        score: 0.88,
      };

      const message: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Tôi có thể hỗ trợ gì cho bạn?',
        tools: [toolStep],
        confirm: {
          calls: [confirmCall],
          decided: true,
        },
        sources: [source],
        error: 'Lỗi thử nghiệm',
        createdAt: '2026-10-21T12:00:00.000Z',
      };

      expect(message.role).toBe('assistant');
      expect(message.tools).toHaveLength(1);
      expect(message.tools[0].name).toBe('search');
      expect(message.confirm?.calls).toHaveLength(1);
      expect(message.confirm?.decided).toBe(true);
      expect(message.sources?.[0].slug).toBe('support-docs');
      expect(message.error).toBe('Lỗi thử nghiệm');
    });

    it('supports ChatMessage confirm with decided undefined', () => {
      const message: ChatMessage = {
        id: 'msg-3',
        role: 'assistant',
        content: 'Bạn có chắc chắn muốn tiếp tục?',
        tools: [],
        confirm: {
          calls: [],
        },
        createdAt: '2026-10-21T12:05:00.000Z',
      };

      expect(message.confirm?.calls).toEqual([]);
      expect(message.confirm?.decided).toBeUndefined();
    });
  });
});
