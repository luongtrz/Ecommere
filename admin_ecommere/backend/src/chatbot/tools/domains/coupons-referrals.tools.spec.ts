import {
  createCouponsReferralsTools,
  CouponsReferralsToolDeps,
  COUPON_TYPES,
} from './coupons-referrals.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { CouponsService } from '../../../coupons/coupons.service';
import type { ReferralsService } from '../../../referrals/referrals.service';

describe('Coupons and Referrals Tools', () => {
  let mockCouponsService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  let mockReferralsService: {
    getConfig: jest.Mock;
    updateConfig: jest.Mock;
    getStats: jest.Mock;
    getAllReferrals: jest.Mock;
  };

  let tools: AgentToolDef[];
  let listCouponsTool: AgentToolDef;
  let getCouponTool: AgentToolDef;
  let createCouponTool: AgentToolDef;
  let updateCouponTool: AgentToolDef;
  let deleteCouponTool: AgentToolDef;
  let getReferralConfigTool: AgentToolDef;
  let updateReferralConfigTool: AgentToolDef;
  let getReferralStatsTool: AgentToolDef;
  let listReferralsTool: AgentToolDef;

  const adminCtx: ToolContext = {
    userId: 'admin-123',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-admin-1',
  };

  beforeEach(() => {
    mockCouponsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockReferralsService = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn(),
      getAllReferrals: jest.fn(),
    };

    const deps: CouponsReferralsToolDeps = {
      coupons: mockCouponsService as unknown as CouponsService,
      referrals: mockReferralsService as unknown as ReferralsService,
    };

    tools = createCouponsReferralsTools(deps);
    listCouponsTool = tools.find((t) => t.name === 'list_coupons')!;
    getCouponTool = tools.find((t) => t.name === 'get_coupon')!;
    createCouponTool = tools.find((t) => t.name === 'create_coupon')!;
    updateCouponTool = tools.find((t) => t.name === 'update_coupon')!;
    deleteCouponTool = tools.find((t) => t.name === 'delete_coupon')!;
    getReferralConfigTool = tools.find(
      (t) => t.name === 'get_referral_config',
    )!;
    updateReferralConfigTool = tools.find(
      (t) => t.name === 'update_referral_config',
    )!;
    getReferralStatsTool = tools.find((t) => t.name === 'get_referral_stats')!;
    listReferralsTool = tools.find((t) => t.name === 'list_referrals')!;
  });

  describe('Factory and General Requirements', () => {
    it('returns exactly 9 tools with unique names', () => {
      expect(tools).toHaveLength(9);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(9);
      expect(names).toEqual([
        'list_coupons',
        'get_coupon',
        'create_coupon',
        'update_coupon',
        'delete_coupon',
        'get_referral_config',
        'update_referral_config',
        'get_referral_stats',
        'list_referrals',
      ]);
    });

    it('sets auth to "admin" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('admin');
      }
    });

    it('assigns correct domains: "coupons" for coupon tools, "referrals" for referral tools', () => {
      expect(listCouponsTool.domain).toBe('coupons');
      expect(getCouponTool.domain).toBe('coupons');
      expect(createCouponTool.domain).toBe('coupons');
      expect(updateCouponTool.domain).toBe('coupons');
      expect(deleteCouponTool.domain).toBe('coupons');

      expect(getReferralConfigTool.domain).toBe('referrals');
      expect(updateReferralConfigTool.domain).toBe('referrals');
      expect(getReferralStatsTool.domain).toBe('referrals');
      expect(listReferralsTool.domain).toBe('referrals');
    });

    it('assigns correct risk levels: delete_coupon is DESTRUCTIVE; create and update tools are SENSITIVE; read tools are READ', () => {
      expect(deleteCouponTool.risk).toBe('DESTRUCTIVE');

      expect(createCouponTool.risk).toBe('SENSITIVE');
      expect(updateCouponTool.risk).toBe('SENSITIVE');
      expect(updateReferralConfigTool.risk).toBe('SENSITIVE');

      expect(listCouponsTool.risk).toBe('READ');
      expect(getCouponTool.risk).toBe('READ');
      expect(getReferralConfigTool.risk).toBe('READ');
      expect(getReferralStatsTool.risk).toBe('READ');
      expect(listReferralsTool.risk).toBe('READ');
    });

    it('enforces strict schema on all tools (rejects unknown properties)', () => {
      for (const tool of tools) {
        const result = tool.schema.safeParse({ unexpectedProperty: 'value' });
        expect(result.success).toBe(false);
      }
    });

    it('does not include userId or role in any schema', () => {
      for (const tool of tools) {
        expect(tool.schema.shape).not.toHaveProperty('userId');
        expect(tool.schema.shape).not.toHaveProperty('role');

        const checkUserId = tool.schema.safeParse({ userId: 'user-1' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'ADMIN' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('ensures each tool has a summarize function returning a short Vietnamese string', () => {
      for (const tool of tools) {
        const summary = tool.summarize({
          code: 'SUMMER2026',
          page: 1,
        });
        expect(typeof summary).toBe('string');
        expect(summary.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('list_coupons', () => {
    it('has risk READ and calls coupons.findAll with provided pagination arguments', async () => {
      expect(listCouponsTool.risk).toBe('READ');
      mockCouponsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      });

      const result = await listCouponsTool.handler(
        { page: 2, limit: 10 },
        adminCtx,
      );

      expect(mockCouponsService.findAll).toHaveBeenCalledTimes(1);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
      });
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      });
    });

    it('calls coupons.findAll with undefined fields when no arguments are given', async () => {
      mockCouponsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await listCouponsTool.handler({}, adminCtx);

      expect(mockCouponsService.findAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
      });
    });

    it('validates page (1..50) and limit (1..50) range', () => {
      expect(listCouponsTool.schema.safeParse({ page: 0 }).success).toBe(false);
      expect(listCouponsTool.schema.safeParse({ page: 51 }).success).toBe(
        false,
      );
      expect(listCouponsTool.schema.safeParse({ limit: 0 }).success).toBe(
        false,
      );
      expect(listCouponsTool.schema.safeParse({ limit: 51 }).success).toBe(
        false,
      );
      expect(
        listCouponsTool.schema.safeParse({ page: 1, limit: 50 }).success,
      ).toBe(true);
      expect(listCouponsTool.schema.safeParse({}).success).toBe(true);
    });

    it('summarize returns a Vietnamese string with or without page', () => {
      expect(listCouponsTool.summarize({})).toBe('Xem danh sách mã giảm giá');
      expect(listCouponsTool.summarize({ page: 2 })).toBe(
        'Xem danh sách mã giảm giá (trang 2)',
      );
    });
  });

  describe('get_coupon', () => {
    it('has risk READ and calls coupons.findOne with code', async () => {
      expect(getCouponTool.risk).toBe('READ');
      mockCouponsService.findOne.mockResolvedValue({
        id: 'cpn-1',
        code: 'SUMMER2026',
        type: 'PERCENT',
        value: 15,
      });

      const result = await getCouponTool.handler(
        { code: 'SUMMER2026' },
        adminCtx,
      );

      expect(mockCouponsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockCouponsService.findOne).toHaveBeenCalledWith('SUMMER2026');
      expect(result).toEqual({
        id: 'cpn-1',
        code: 'SUMMER2026',
        type: 'PERCENT',
        value: 15,
      });
    });

    it('validates code length constraints (1..40)', () => {
      expect(getCouponTool.schema.safeParse({ code: '' }).success).toBe(false);
      expect(
        getCouponTool.schema.safeParse({ code: 'a'.repeat(41) }).success,
      ).toBe(false);
      expect(getCouponTool.schema.safeParse({ code: 'SUMMER' }).success).toBe(
        true,
      );
    });

    it('summarize returns a Vietnamese string with code', () => {
      expect(getCouponTool.summarize({ code: 'SUMMER' })).toBe(
        'Xem chi tiết mã giảm giá SUMMER',
      );
    });
  });

  describe('create_coupon', () => {
    it('has risk SENSITIVE and matches expected description', () => {
      expect(createCouponTool.risk).toBe('SENSITIVE');
      expect(createCouponTool.description).toBe(
        'Tạo mã giảm giá. Mã được lưu chữ hoa. Giá trị PERCENT từ 0 đến 100. Ngày bắt đầu phải trước ngày kết thúc.',
      );
    });

    it('calls coupons.create with expected arguments, converting validFrom and validUntil to Date objects', async () => {
      const validFromStr = '2026-06-01T00:00:00.000Z';
      const validUntilStr = '2026-06-30T23:59:59.000Z';

      mockCouponsService.create.mockResolvedValue({
        id: 'cpn-1',
        code: 'SUMMER2026',
        type: 'PERCENT',
        value: 20,
        minOrder: 100000,
        maxDiscount: 50000,
        validFrom: new Date(validFromStr),
        validUntil: new Date(validUntilStr),
        maxUses: 100,
        maxUsesPerUser: 1,
      });

      const result = await createCouponTool.handler(
        {
          code: 'SUMMER2026',
          type: 'PERCENT',
          value: 20,
          minOrder: 100000,
          maxDiscount: 50000,
          validFrom: validFromStr,
          validUntil: validUntilStr,
          maxUses: 100,
          maxUsesPerUser: 1,
        },
        adminCtx,
      );

      expect(mockCouponsService.create).toHaveBeenCalledTimes(1);
      const callArg = mockCouponsService.create.mock.calls[0][0];
      expect(callArg.code).toBe('SUMMER2026');
      expect(callArg.type).toBe('PERCENT');
      expect(callArg.value).toBe(20);
      expect(callArg.minOrder).toBe(100000);
      expect(callArg.maxDiscount).toBe(50000);
      expect(callArg.validFrom).toBeInstanceOf(Date);
      expect(callArg.validFrom.toISOString()).toBe(validFromStr);
      expect(callArg.validUntil).toBeInstanceOf(Date);
      expect(callArg.validUntil.toISOString()).toBe(validUntilStr);
      expect(callArg.maxUses).toBe(100);
      expect(callArg.maxUsesPerUser).toBe(1);

      expect(result).toHaveProperty('id', 'cpn-1');
    });

    it('calls coupons.create without optional fields', async () => {
      mockCouponsService.create.mockResolvedValue({
        id: 'cpn-2',
        code: 'FREESHIP2026',
        type: 'FREESHIP',
        value: 0,
      });

      await createCouponTool.handler(
        {
          code: 'FREESHIP2026',
          type: 'FREESHIP',
          value: 0,
        },
        adminCtx,
      );

      expect(mockCouponsService.create).toHaveBeenCalledWith({
        code: 'FREESHIP2026',
        type: 'FREESHIP',
        value: 0,
      });
    });

    it('rejects a type FIXED_AMOUNT (the enum has no such value)', () => {
      const res = createCouponTool.schema.safeParse({
        code: 'DISCOUNT',
        type: 'FIXED_AMOUNT',
        value: 10000,
      });
      expect(res.success).toBe(false);
    });

    it('accepts valid types PERCENT, FIXED, and FREESHIP', () => {
      for (const t of COUPON_TYPES) {
        const res = createCouponTool.schema.safeParse({
          code: 'CODE',
          type: t,
          value: 10,
        });
        expect(res.success).toBe(true);
      }
    });

    it('rejects a missing code', () => {
      const res = createCouponTool.schema.safeParse({
        type: 'PERCENT',
        value: 10,
      });
      expect(res.success).toBe(false);
    });

    it('rejects negative value, minOrder, maxDiscount, and maxUses < 1', () => {
      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: -1,
        }).success,
      ).toBe(false);

      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: 10,
          minOrder: -50,
        }).success,
      ).toBe(false);

      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: 10,
          maxDiscount: -100,
        }).success,
      ).toBe(false);

      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: 10,
          maxUses: 0,
        }).success,
      ).toBe(false);

      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: 10,
          maxUsesPerUser: 0,
        }).success,
      ).toBe(false);
    });

    it('rejects invalid date strings for validFrom and validUntil', () => {
      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: 10,
          validFrom: 'not-a-date',
        }).success,
      ).toBe(false);

      expect(
        createCouponTool.schema.safeParse({
          code: 'A',
          type: 'PERCENT',
          value: 10,
          validUntil: '2026-99-99',
        }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese string with code', () => {
      expect(createCouponTool.summarize({ code: 'SUMMER2026' })).toBe(
        'Tạo mã giảm giá SUMMER2026',
      );
    });
  });

  describe('update_coupon', () => {
    it('has risk SENSITIVE and matches expected description', () => {
      expect(updateCouponTool.risk).toBe('SENSITIVE');
      expect(updateCouponTool.description).toBe(
        'Sửa mã giảm giá, kể cả bật hoặc tắt mã bằng trường active.',
      );
    });

    it('calls coupons.update with code and fields, converting dates to Date objects', async () => {
      const validFromStr = '2026-07-01T00:00:00.000Z';
      const validUntilStr = '2026-07-31T23:59:59.000Z';

      mockCouponsService.update.mockResolvedValue({
        id: 'cpn-1',
        code: 'SUMMER2026',
        value: 25,
      });

      const result = await updateCouponTool.handler(
        {
          code: 'SUMMER2026',
          value: 25,
          validFrom: validFromStr,
          validUntil: validUntilStr,
        },
        adminCtx,
      );

      expect(mockCouponsService.update).toHaveBeenCalledTimes(1);
      const [calledCode, calledFields] =
        mockCouponsService.update.mock.calls[0];
      expect(calledCode).toBe('SUMMER2026');
      expect(calledFields.value).toBe(25);
      expect(calledFields.validFrom).toBeInstanceOf(Date);
      expect(calledFields.validFrom.toISOString()).toBe(validFromStr);
      expect(calledFields.validUntil).toBeInstanceOf(Date);
      expect(calledFields.validUntil.toISOString()).toBe(validUntilStr);
      expect(result).toEqual({ id: 'cpn-1', code: 'SUMMER2026', value: 25 });
    });

    it('rejects a call with only code in handler check', async () => {
      await expect(
        updateCouponTool.handler({ code: 'SUMMER2026' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateCouponTool.handler({ code: 'SUMMER2026' }, adminCtx),
      ).rejects.toThrow('Cần ít nhất một trường ngoài mã code để cập nhật');
      expect(mockCouponsService.update).not.toHaveBeenCalled();
    });

    it('accepts active false and calls coupons.update with { active: false }', async () => {
      mockCouponsService.update.mockResolvedValue({
        id: 'cpn-1',
        code: 'SUMMER2026',
        active: false,
      });

      await updateCouponTool.handler(
        { code: 'SUMMER2026', active: false },
        adminCtx,
      );

      expect(mockCouponsService.update).toHaveBeenCalledWith('SUMMER2026', {
        active: false,
      });
    });

    it('accepts active true', async () => {
      mockCouponsService.update.mockResolvedValue({
        id: 'cpn-1',
        code: 'SUMMER2026',
        active: true,
      });

      await updateCouponTool.handler(
        { code: 'SUMMER2026', active: true },
        adminCtx,
      );

      expect(mockCouponsService.update).toHaveBeenCalledWith('SUMMER2026', {
        active: true,
      });
    });

    it('accepts partial updates for individual fields', async () => {
      mockCouponsService.update.mockResolvedValue({ id: 'cpn-1' });

      await updateCouponTool.handler(
        { code: 'SALE', maxDiscount: 20000 },
        adminCtx,
      );
      expect(mockCouponsService.update).toHaveBeenCalledWith('SALE', {
        maxDiscount: 20000,
      });

      mockCouponsService.update.mockClear();
      await updateCouponTool.handler(
        { code: 'SALE', type: 'FIXED', minOrder: 50000 },
        adminCtx,
      );
      expect(mockCouponsService.update).toHaveBeenCalledWith('SALE', {
        type: 'FIXED',
        minOrder: 50000,
      });

      mockCouponsService.update.mockClear();
      await updateCouponTool.handler(
        { code: 'SALE', maxUses: 50, maxUsesPerUser: 2 },
        adminCtx,
      );
      expect(mockCouponsService.update).toHaveBeenCalledWith('SALE', {
        maxUses: 50,
        maxUsesPerUser: 2,
      });
    });

    it('summarize returns a Vietnamese string with code', () => {
      expect(updateCouponTool.summarize({ code: 'SUMMER2026' })).toBe(
        'Cập nhật mã giảm giá SUMMER2026',
      );
    });
  });

  describe('delete_coupon', () => {
    it('has risk DESTRUCTIVE, expected description, and calls coupons.remove', async () => {
      expect(deleteCouponTool.risk).toBe('DESTRUCTIVE');
      expect(deleteCouponTool.description).toBe(
        'Xóa mã giảm giá. Không được xóa mã đã dùng trong đơn hàng hoặc đang nằm trong giỏ hàng. Muốn ngừng dùng mã thì nên tắt bằng update_coupon.',
      );

      mockCouponsService.remove.mockResolvedValue({
        message: 'Coupon deleted successfully',
      });

      const result = await deleteCouponTool.handler(
        { code: 'SUMMER2026' },
        adminCtx,
      );

      expect(mockCouponsService.remove).toHaveBeenCalledTimes(1);
      expect(mockCouponsService.remove).toHaveBeenCalledWith('SUMMER2026');
      expect(result).toEqual({ message: 'Coupon deleted successfully' });
    });

    it('validates code length constraints (1..40)', () => {
      expect(deleteCouponTool.schema.safeParse({ code: '' }).success).toBe(
        false,
      );
      expect(
        deleteCouponTool.schema.safeParse({ code: 'a'.repeat(41) }).success,
      ).toBe(false);
      expect(deleteCouponTool.schema.safeParse({ code: 'OK' }).success).toBe(
        true,
      );
    });

    it('summarize returns a Vietnamese string with code', () => {
      expect(deleteCouponTool.summarize({ code: 'SUMMER2026' })).toBe(
        'Xóa mã giảm giá SUMMER2026',
      );
    });
  });

  describe('get_referral_config', () => {
    it('has risk READ, expected description, and calls referrals.getConfig', async () => {
      expect(getReferralConfigTool.risk).toBe('READ');
      expect(getReferralConfigTool.description).toBe(
        'Cấu hình chương trình giới thiệu. Lần đầu sẽ tự tạo cấu hình mặc định.',
      );

      const mockConfig = {
        id: 'cfg-1',
        active: true,
        referrerCouponType: 'PERCENT',
        referrerCouponValue: 10,
        refereeCouponType: 'PERCENT',
        refereeCouponValue: 5,
        couponValidDays: 30,
      };
      mockReferralsService.getConfig.mockResolvedValue(mockConfig);

      const result = await getReferralConfigTool.handler({}, adminCtx);

      expect(mockReferralsService.getConfig).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockConfig);
    });

    it('summarize returns a Vietnamese string', () => {
      expect(getReferralConfigTool.summarize({})).toBe(
        'Xem cấu hình chương trình giới thiệu',
      );
    });
  });

  describe('update_referral_config', () => {
    it('has risk SENSITIVE and calls referrals.updateConfig with provided fields', async () => {
      expect(updateReferralConfigTool.risk).toBe('SENSITIVE');

      mockReferralsService.updateConfig.mockResolvedValue({
        id: 'cfg-1',
        active: true,
        referrerCouponType: 'PERCENT',
        referrerCouponValue: 15,
      });

      const result = await updateReferralConfigTool.handler(
        {
          active: true,
          referrerCouponType: 'PERCENT',
          referrerCouponValue: 15,
        },
        adminCtx,
      );

      expect(mockReferralsService.updateConfig).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.updateConfig).toHaveBeenCalledWith({
        active: true,
        referrerCouponType: 'PERCENT',
        referrerCouponValue: 15,
      });
      expect(result).toHaveProperty('id', 'cfg-1');
    });

    it('rejects a call with no fields in handler check', async () => {
      await expect(
        updateReferralConfigTool.handler({}, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateReferralConfigTool.handler({}, adminCtx),
      ).rejects.toThrow(
        'Cần ít nhất một trường để cập nhật cấu hình giới thiệu',
      );
      expect(mockReferralsService.updateConfig).not.toHaveBeenCalled();
    });

    it('accepts active false and calls referrals.updateConfig with { active: false }', async () => {
      mockReferralsService.updateConfig.mockResolvedValue({
        id: 'cfg-1',
        active: false,
      });

      await updateReferralConfigTool.handler({ active: false }, adminCtx);

      expect(mockReferralsService.updateConfig).toHaveBeenCalledWith({
        active: false,
      });
    });

    it('accepts all UpdateReferralConfigDto fields individually and combined', async () => {
      mockReferralsService.updateConfig.mockResolvedValue({ id: 'cfg-1' });

      const fullPayload = {
        active: true,
        referrerCouponType: 'FIXED' as const,
        referrerCouponValue: 50000,
        referrerMaxDiscount: 100000,
        refereeCouponType: 'PERCENT' as const,
        refereeCouponValue: 10,
        refereeMaxDiscount: 30000,
        minOrderForCoupon: 200000,
        couponValidDays: 45,
        maxReferralsPerUser: 5,
      };

      await updateReferralConfigTool.handler(fullPayload, adminCtx);

      expect(mockReferralsService.updateConfig).toHaveBeenCalledWith(
        fullPayload,
      );
    });

    it('validates limits: couponValidDays >= 1, maxReferralsPerUser >= 1, values >= 0', () => {
      expect(
        updateReferralConfigTool.schema.safeParse({ couponValidDays: 0 })
          .success,
      ).toBe(false);
      expect(
        updateReferralConfigTool.schema.safeParse({ maxReferralsPerUser: 0 })
          .success,
      ).toBe(false);
      expect(
        updateReferralConfigTool.schema.safeParse({ referrerCouponValue: -1 })
          .success,
      ).toBe(false);
      expect(
        updateReferralConfigTool.schema.safeParse({ refereeCouponValue: -1 })
          .success,
      ).toBe(false);
      expect(
        updateReferralConfigTool.schema.safeParse({ minOrderForCoupon: -1 })
          .success,
      ).toBe(false);
      expect(
        updateReferralConfigTool.schema.safeParse({ referrerMaxDiscount: -1 })
          .success,
      ).toBe(false);
      expect(
        updateReferralConfigTool.schema.safeParse({ refereeMaxDiscount: -1 })
          .success,
      ).toBe(false);

      expect(
        updateReferralConfigTool.schema.safeParse({
          couponValidDays: 1,
          maxReferralsPerUser: 1,
          minOrderForCoupon: 0,
        }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string', () => {
      expect(updateReferralConfigTool.summarize({})).toBe(
        'Cập nhật cấu hình chương trình giới thiệu',
      );
    });
  });

  describe('get_referral_stats', () => {
    it('has risk READ and calls referrals.getStats', async () => {
      expect(getReferralStatsTool.risk).toBe('READ');

      const mockStats = {
        totalReferrals: 10,
        totalCouponsCreated: 20,
        isActive: true,
        topReferrers: [],
      };
      mockReferralsService.getStats.mockResolvedValue(mockStats);

      const result = await getReferralStatsTool.handler({}, adminCtx);

      expect(mockReferralsService.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStats);
    });

    it('summarize returns a Vietnamese string', () => {
      expect(getReferralStatsTool.summarize({})).toBe(
        'Xem thống kê chương trình giới thiệu',
      );
    });
  });

  describe('list_referrals', () => {
    it('has risk READ and calls referrals.getAllReferrals with pagination', async () => {
      expect(listReferralsTool.risk).toBe('READ');

      const mockList = {
        data: [],
        total: 0,
        page: 3,
        limit: 15,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      };
      mockReferralsService.getAllReferrals.mockResolvedValue(mockList);

      const result = await listReferralsTool.handler(
        { page: 3, limit: 15 },
        adminCtx,
      );

      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledWith({
        page: 3,
        limit: 15,
      });
      expect(result).toEqual(mockList);
    });

    it('calls referrals.getAllReferrals with undefined when no arguments are provided', async () => {
      mockReferralsService.getAllReferrals.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await listReferralsTool.handler({}, adminCtx);

      expect(mockReferralsService.getAllReferrals).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
      });
    });

    it('validates page (1..50) and limit (1..50) range', () => {
      expect(listReferralsTool.schema.safeParse({ page: 0 }).success).toBe(
        false,
      );
      expect(listReferralsTool.schema.safeParse({ page: 51 }).success).toBe(
        false,
      );
      expect(listReferralsTool.schema.safeParse({ limit: 0 }).success).toBe(
        false,
      );
      expect(listReferralsTool.schema.safeParse({ limit: 51 }).success).toBe(
        false,
      );
      expect(
        listReferralsTool.schema.safeParse({ page: 1, limit: 50 }).success,
      ).toBe(true);
      expect(listReferralsTool.schema.safeParse({}).success).toBe(true);
    });

    it('summarize returns a Vietnamese string with or without page', () => {
      expect(listReferralsTool.summarize({})).toBe(
        'Xem danh sách lượt giới thiệu',
      );
      expect(listReferralsTool.summarize({ page: 3 })).toBe(
        'Xem danh sách lượt giới thiệu (trang 3)',
      );
    });
  });
});
