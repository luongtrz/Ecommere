import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { CouponsService } from '../../../coupons/coupons.service';
import type { ReferralsService } from '../../../referrals/referrals.service';

export const COUPON_TYPES = ['PERCENT', 'FIXED', 'FREESHIP'] as const;

export const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}(:?\d{2})?)?)?$/;

export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, 'Định dạng ngày ISO không hợp lệ')
  .refine((val) => !isNaN(Date.parse(val)), 'Ngày không hợp lệ');

export type CouponsReferralsToolDeps = {
  coupons: CouponsService;
  referrals: ReferralsService;
};

export function createCouponsReferralsTools(
  deps: CouponsReferralsToolDeps,
): AgentToolDef[] {
  // 1. list_coupons
  const listCouponsTool: AgentToolDef = {
    name: 'list_coupons',
    domain: 'coupons',
    description: 'Danh sách mã giảm giá kèm phân trang.',
    schema: z
      .object({
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: { page?: number; limit?: number },
      _ctx: ToolContext,
    ) => {
      return deps.coupons.findAll({
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.page
        ? `Xem danh sách mã giảm giá (trang ${args.page})`
        : 'Xem danh sách mã giảm giá',
  };

  // 2. get_coupon
  const getCouponTool: AgentToolDef = {
    name: 'get_coupon',
    domain: 'coupons',
    description: 'Xem thông tin chi tiết của một mã giảm giá theo mã.',
    schema: z
      .object({
        code: z.string().min(1).max(40),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args: { code: string }, _ctx: ToolContext) => {
      return deps.coupons.findOne(args.code);
    },
    summarize: (args) => `Xem chi tiết mã giảm giá ${args.code}`,
  };

  // 3. create_coupon
  const createCouponTool: AgentToolDef = {
    name: 'create_coupon',
    domain: 'coupons',
    description:
      'Tạo mã giảm giá. Mã được lưu chữ hoa. Giá trị PERCENT từ 0 đến 100. Ngày bắt đầu phải trước ngày kết thúc.',
    schema: z
      .object({
        code: z.string().min(1).max(40),
        type: z.enum(COUPON_TYPES),
        value: z.number().int().min(0),
        minOrder: z.number().int().min(0).optional(),
        maxDiscount: z.number().int().min(0).optional(),
        validFrom: isoDateSchema.optional(),
        validUntil: isoDateSchema.optional(),
        maxUses: z.number().int().min(1).optional(),
        maxUsesPerUser: z.number().int().min(1).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'SENSITIVE',
    handler: async (
      args: {
        code: string;
        type: (typeof COUPON_TYPES)[number];
        value: number;
        minOrder?: number;
        maxDiscount?: number;
        validFrom?: string;
        validUntil?: string;
        maxUses?: number;
        maxUsesPerUser?: number;
      },
      _ctx: ToolContext,
    ) => {
      const dto: {
        code: string;
        type: (typeof COUPON_TYPES)[number];
        value: number;
        minOrder?: number;
        maxDiscount?: number;
        validFrom?: Date;
        validUntil?: Date;
        maxUses?: number;
        maxUsesPerUser?: number;
      } = {
        code: args.code,
        type: args.type,
        value: args.value,
      };

      if (args.minOrder !== undefined) dto.minOrder = args.minOrder;
      if (args.maxDiscount !== undefined) dto.maxDiscount = args.maxDiscount;
      if (args.validFrom !== undefined)
        dto.validFrom = new Date(args.validFrom);
      if (args.validUntil !== undefined)
        dto.validUntil = new Date(args.validUntil);
      if (args.maxUses !== undefined) dto.maxUses = args.maxUses;
      if (args.maxUsesPerUser !== undefined)
        dto.maxUsesPerUser = args.maxUsesPerUser;

      return deps.coupons.create(dto);
    },
    summarize: (args) => `Tạo mã giảm giá ${args.code}`,
  };

  // 4. update_coupon
  const updateCouponTool: AgentToolDef = {
    name: 'update_coupon',
    domain: 'coupons',
    description: 'Sửa mã giảm giá, kể cả bật hoặc tắt mã bằng trường active.',
    schema: z
      .object({
        code: z.string().min(1).max(40),
        type: z.enum(COUPON_TYPES).optional(),
        value: z.number().int().min(0).optional(),
        minOrder: z.number().int().min(0).optional(),
        maxDiscount: z.number().int().min(0).optional(),
        validFrom: isoDateSchema.optional(),
        validUntil: isoDateSchema.optional(),
        maxUses: z.number().int().min(1).optional(),
        maxUsesPerUser: z.number().int().min(1).optional(),
        active: z.boolean().optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'SENSITIVE',
    handler: async (
      args: {
        code: string;
        type?: (typeof COUPON_TYPES)[number];
        value?: number;
        minOrder?: number;
        maxDiscount?: number;
        validFrom?: string;
        validUntil?: string;
        maxUses?: number;
        maxUsesPerUser?: number;
        active?: boolean;
      },
      _ctx: ToolContext,
    ) => {
      const fields: {
        type?: (typeof COUPON_TYPES)[number];
        value?: number;
        minOrder?: number;
        maxDiscount?: number;
        validFrom?: Date;
        validUntil?: Date;
        maxUses?: number;
        maxUsesPerUser?: number;
        active?: boolean;
      } = {};

      if (args.type !== undefined) fields.type = args.type;
      if (args.value !== undefined) fields.value = args.value;
      if (args.minOrder !== undefined) fields.minOrder = args.minOrder;
      if (args.maxDiscount !== undefined) fields.maxDiscount = args.maxDiscount;
      if (args.validFrom !== undefined)
        fields.validFrom = new Date(args.validFrom);
      if (args.validUntil !== undefined)
        fields.validUntil = new Date(args.validUntil);
      if (args.maxUses !== undefined) fields.maxUses = args.maxUses;
      if (args.maxUsesPerUser !== undefined)
        fields.maxUsesPerUser = args.maxUsesPerUser;
      if (args.active !== undefined) fields.active = args.active;

      if (Object.keys(fields).length === 0) {
        throw new ToolError('Cần ít nhất một trường ngoài mã code để cập nhật');
      }

      return deps.coupons.update(args.code, fields);
    },
    summarize: (args) => `Cập nhật mã giảm giá ${args.code}`,
  };

  // 5. delete_coupon
  const deleteCouponTool: AgentToolDef = {
    name: 'delete_coupon',
    domain: 'coupons',
    description:
      'Xóa mã giảm giá. Không được xóa mã đã dùng trong đơn hàng hoặc đang nằm trong giỏ hàng. Muốn ngừng dùng mã thì nên tắt bằng update_coupon.',
    schema: z
      .object({
        code: z.string().min(1).max(40),
      })
      .strict(),
    auth: 'admin',
    risk: 'DESTRUCTIVE',
    handler: async (args: { code: string }, _ctx: ToolContext) => {
      return deps.coupons.remove(args.code);
    },
    summarize: (args) => `Xóa mã giảm giá ${args.code}`,
  };

  // 6. get_referral_config
  const getReferralConfigTool: AgentToolDef = {
    name: 'get_referral_config',
    domain: 'referrals',
    description:
      'Cấu hình chương trình giới thiệu. Lần đầu sẽ tự tạo cấu hình mặc định.',
    schema: z.object({}).strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (_args: Record<string, never>, _ctx: ToolContext) => {
      return deps.referrals.getConfig();
    },
    summarize: () => 'Xem cấu hình chương trình giới thiệu',
  };

  // 7. update_referral_config
  const updateReferralConfigTool: AgentToolDef = {
    name: 'update_referral_config',
    domain: 'referrals',
    description:
      'Cập nhật cấu hình chương trình giới thiệu (tỷ lệ thưởng, thời hạn, giới hạn). Cần cung cấp ít nhất một trường.',
    schema: z
      .object({
        active: z.boolean().optional(),
        referrerCouponType: z.enum(COUPON_TYPES).optional(),
        referrerCouponValue: z.number().int().min(0).optional(),
        referrerMaxDiscount: z.number().int().min(0).optional(),
        refereeCouponType: z.enum(COUPON_TYPES).optional(),
        refereeCouponValue: z.number().int().min(0).optional(),
        refereeMaxDiscount: z.number().int().min(0).optional(),
        minOrderForCoupon: z.number().int().min(0).optional(),
        couponValidDays: z.number().int().min(1).optional(),
        maxReferralsPerUser: z.number().int().min(1).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'SENSITIVE',
    handler: async (
      args: {
        active?: boolean;
        referrerCouponType?: (typeof COUPON_TYPES)[number];
        referrerCouponValue?: number;
        referrerMaxDiscount?: number;
        refereeCouponType?: (typeof COUPON_TYPES)[number];
        refereeCouponValue?: number;
        refereeMaxDiscount?: number;
        minOrderForCoupon?: number;
        couponValidDays?: number;
        maxReferralsPerUser?: number;
      },
      _ctx: ToolContext,
    ) => {
      const fields: {
        active?: boolean;
        referrerCouponType?: (typeof COUPON_TYPES)[number];
        referrerCouponValue?: number;
        referrerMaxDiscount?: number;
        refereeCouponType?: (typeof COUPON_TYPES)[number];
        refereeCouponValue?: number;
        refereeMaxDiscount?: number;
        minOrderForCoupon?: number;
        couponValidDays?: number;
        maxReferralsPerUser?: number;
      } = {};

      if (args.active !== undefined) fields.active = args.active;
      if (args.referrerCouponType !== undefined)
        fields.referrerCouponType = args.referrerCouponType;
      if (args.referrerCouponValue !== undefined)
        fields.referrerCouponValue = args.referrerCouponValue;
      if (args.referrerMaxDiscount !== undefined)
        fields.referrerMaxDiscount = args.referrerMaxDiscount;
      if (args.refereeCouponType !== undefined)
        fields.refereeCouponType = args.refereeCouponType;
      if (args.refereeCouponValue !== undefined)
        fields.refereeCouponValue = args.refereeCouponValue;
      if (args.refereeMaxDiscount !== undefined)
        fields.refereeMaxDiscount = args.refereeMaxDiscount;
      if (args.minOrderForCoupon !== undefined)
        fields.minOrderForCoupon = args.minOrderForCoupon;
      if (args.couponValidDays !== undefined)
        fields.couponValidDays = args.couponValidDays;
      if (args.maxReferralsPerUser !== undefined)
        fields.maxReferralsPerUser = args.maxReferralsPerUser;

      if (Object.keys(fields).length === 0) {
        throw new ToolError(
          'Cần ít nhất một trường để cập nhật cấu hình giới thiệu',
        );
      }

      return deps.referrals.updateConfig(fields);
    },
    summarize: () => 'Cập nhật cấu hình chương trình giới thiệu',
  };

  // 8. get_referral_stats
  const getReferralStatsTool: AgentToolDef = {
    name: 'get_referral_stats',
    domain: 'referrals',
    description: 'Xem thống kê tổng quan của chương trình giới thiệu.',
    schema: z.object({}).strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (_args: Record<string, never>, _ctx: ToolContext) => {
      return deps.referrals.getStats();
    },
    summarize: () => 'Xem thống kê chương trình giới thiệu',
  };

  // 9. list_referrals
  const listReferralsTool: AgentToolDef = {
    name: 'list_referrals',
    domain: 'referrals',
    description:
      'Danh sách lượt giới thiệu kèm thông tin người giới thiệu và người được giới thiệu.',
    schema: z
      .object({
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: { page?: number; limit?: number },
      _ctx: ToolContext,
    ) => {
      return deps.referrals.getAllReferrals({
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.page
        ? `Xem danh sách lượt giới thiệu (trang ${args.page})`
        : 'Xem danh sách lượt giới thiệu',
  };

  return [
    listCouponsTool,
    getCouponTool,
    createCouponTool,
    updateCouponTool,
    deleteCouponTool,
    getReferralConfigTool,
    updateReferralConfigTool,
    getReferralStatsTool,
    listReferralsTool,
  ];
}
