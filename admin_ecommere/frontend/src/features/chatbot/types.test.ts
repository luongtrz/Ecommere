import { describe, expect, it } from 'vitest';
import * as typesModule from './types';
import type {
  ChatRole,
  ChatToolStep,
  ChatConfirmCall,
  ChatSource,
  ChatMessage,
} from './types';

describe('chatbot types module', () => {
  it('loads the module successfully', () => {
    expect(typesModule).toBeDefined();
    expect(typeof typesModule).toBe('object');
  });

  it('can be dynamically imported', async () => {
    const mod = await import('./types');
    expect(mod).toBeDefined();
  });

  it('does not export unexpected runtime values', () => {
    const exportedKeys = Object.keys(typesModule);
    expect(exportedKeys).toEqual([]);
  });

  describe('ChatRole type usage', () => {
    it('accepts valid role literals', () => {
      const userRole: ChatRole = 'user';
      const assistantRole: ChatRole = 'assistant';
      const systemRole: ChatRole = 'system';

      expect(userRole).toBe('user');
      expect(assistantRole).toBe('assistant');
      expect(systemRole).toBe('system');
    });
  });

  describe('ChatToolStep interface usage', () => {
    it('supports step in running status without resultSummary', () => {
      const step: ChatToolStep = {
        id: 'step-1',
        name: 'query_database',
        summary: 'Đang truy vấn cơ sở dữ liệu...',
        status: 'running',
      };

      expect(step.id).toBe('step-1');
      expect(step.name).toBe('query_database');
      expect(step.summary).toBe('Đang truy vấn cơ sở dữ liệu...');
      expect(step.status).toBe('running');
      expect(step.resultSummary).toBeUndefined();
    });

    it('supports step in ok status with resultSummary', () => {
      const step: ChatToolStep = {
        id: 'step-2',
        name: 'find_products',
        summary: 'Tìm kiếm sản phẩm theo từ khóa "bàn phím"',
        status: 'ok',
        resultSummary: 'Tìm thấy 12 sản phẩm phù hợp',
      };

      expect(step.status).toBe('ok');
      expect(step.resultSummary).toBe('Tìm thấy 12 sản phẩm phù hợp');
    });

    it('supports step in error status with resultSummary', () => {
      const step: ChatToolStep = {
        id: 'step-3',
        name: 'sync_orders',
        summary: 'Đồng bộ đơn hàng với kho',
        status: 'error',
        resultSummary: 'Kết nối kho thất bại (504 Gateway Timeout)',
      };

      expect(step.status).toBe('error');
      expect(step.resultSummary).toBe(
        'Kết nối kho thất bại (504 Gateway Timeout)',
      );
    });
  });

  describe('ChatConfirmCall interface usage', () => {
    it('supports WRITE risk confirm call', () => {
      const call: ChatConfirmCall = {
        id: 'call-write',
        name: 'update_price',
        summary: 'Cập nhật giá sản phẩm SP-100 thành 500.000đ',
        risk: 'WRITE',
      };

      expect(call.risk).toBe('WRITE');
      expect(call.name).toBe('update_price');
    });

    it('supports SENSITIVE risk confirm call', () => {
      const call: ChatConfirmCall = {
        id: 'call-sensitive',
        name: 'view_customer_info',
        summary: 'Truy xuất thông tin số điện thoại khách hàng',
        risk: 'SENSITIVE',
      };

      expect(call.risk).toBe('SENSITIVE');
    });

    it('supports DESTRUCTIVE risk confirm call', () => {
      const call: ChatConfirmCall = {
        id: 'call-destructive',
        name: 'delete_coupon',
        summary: 'Xóa vĩnh viễn mã giảm giá TET2026',
        risk: 'DESTRUCTIVE',
      };

      expect(call.risk).toBe('DESTRUCTIVE');
    });
  });

  describe('ChatSource interface usage', () => {
    it('supports source with score', () => {
      const source: ChatSource = {
        id: 'src-1',
        name: 'Chính sách đổi trả',
        slug: 'chinh-sach-doi-tra',
        score: 0.95,
      };

      expect(source.id).toBe('src-1');
      expect(source.name).toBe('Chính sách đổi trả');
      expect(source.slug).toBe('chinh-sach-doi-tra');
      expect(source.score).toBe(0.95);
    });

    it('supports source without score', () => {
      const source: ChatSource = {
        id: 'src-2',
        name: 'Hướng dẫn sử dụng',
        slug: 'huong-dan-su-dung',
      };

      expect(source.score).toBeUndefined();
    });
  });

  describe('ChatMessage interface usage', () => {
    it('supports minimal user message', () => {
      const msg: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Kiểm tra doanh thu hôm nay',
        tools: [],
        createdAt: '2026-10-22T08:00:00.000Z',
      };

      expect(msg.role).toBe('user');
      expect(msg.content).toBe('Kiểm tra doanh thu hôm nay');
      expect(msg.tools).toHaveLength(0);
      expect(msg.confirm).toBeUndefined();
      expect(msg.sources).toBeUndefined();
      expect(msg.error).toBeUndefined();
    });

    it('supports assistant message with tools, confirm calls, and sources', () => {
      const toolStep: ChatToolStep = {
        id: 't-1',
        name: 'get_revenue',
        summary: 'Tính tổng doanh thu ngày 22/10',
        status: 'ok',
        resultSummary: 'Doanh thu: 25.000.000đ',
      };

      const confirmCall: ChatConfirmCall = {
        id: 'c-1',
        name: 'close_daily_report',
        summary: 'Chốt sổ doanh thu cuối ngày',
        risk: 'WRITE',
      };

      const source: ChatSource = {
        id: 's-1',
        name: 'Báo cáo doanh thu',
        slug: 'bao-cao-doanh-thu',
        score: 0.99,
      };

      const msg: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content:
          'Tổng doanh thu hôm nay là 25.000.000đ từ 15 đơn hàng hoàn tất.',
        tools: [toolStep],
        confirm: {
          calls: [confirmCall],
          decided: false,
        },
        sources: [source],
        createdAt: '2026-10-22T08:00:05.000Z',
      };

      expect(msg.role).toBe('assistant');
      expect(msg.tools).toHaveLength(1);
      expect(msg.tools[0].status).toBe('ok');
      expect(msg.confirm?.calls).toHaveLength(1);
      expect(msg.confirm?.decided).toBe(false);
      expect(msg.sources).toHaveLength(1);
      expect(msg.error).toBeUndefined();
    });

    it('supports message with error property and system role', () => {
      const msg: ChatMessage = {
        id: 'msg-3',
        role: 'system',
        content: 'Không thể kết nối đến máy chủ AI',
        tools: [],
        error: 'Network connection failed',
        createdAt: '2026-10-22T08:00:10.000Z',
      };

      expect(msg.role).toBe('system');
      expect(msg.error).toBe('Network connection failed');
    });

    it('supports message with confirm call where decided is true', () => {
      const msg: ChatMessage = {
        id: 'msg-4',
        role: 'assistant',
        content: 'Thao tác đã được xác nhận',
        tools: [],
        confirm: {
          calls: [],
          decided: true,
        },
        createdAt: '2026-10-22T08:01:00.000Z',
      };

      expect(msg.confirm?.decided).toBe(true);
      expect(msg.confirm?.calls).toEqual([]);
    });
  });
});
