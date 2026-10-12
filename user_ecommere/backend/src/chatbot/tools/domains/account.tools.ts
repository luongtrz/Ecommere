import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import type { UsersService } from '../../../users/users.service';
import type { ReferralsService } from '../../../referrals/referrals.service';

export const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

export type AccountToolDeps = {
  users: UsersService;
  referrals: ReferralsService;
};

function projectAddress(addr: any): Record<string, unknown> | unknown {
  if (!addr || typeof addr !== 'object') {
    return addr;
  }
  const projected: Record<string, unknown> = {
    id: addr.id,
    fullName: addr.fullName,
    phone: addr.phone,
    province: addr.province,
    district: addr.district,
    ward: addr.ward,
    line1: addr.line1,
    isDefault: addr.isDefault,
  };
  if (addr.createdAt !== undefined) {
    projected.createdAt = addr.createdAt;
  }
  if (addr.updatedAt !== undefined) {
    projected.updatedAt = addr.updatedAt;
  }
  return projected;
}

function projectList<T>(result: T, itemProjector?: (item: any) => any): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }
  if (Array.isArray(result)) {
    const sliced = result.slice(0, 10);
    return itemProjector ? sliced.map(itemProjector) : sliced;
  }
  if (Array.isArray((result as any).data)) {
    const sliced = (result as any).data.slice(0, 10);
    return {
      ...result,
      data: itemProjector ? sliced.map(itemProjector) : sliced,
    };
  }
  return result;
}

export function createAccountTools(deps: AccountToolDeps): AgentToolDef[] {
  // 1. get_my_profile
  const getMyProfileTool: AgentToolDef = {
    name: 'get_my_profile',
    domain: 'account',
    description: 'Xem thông tin hồ sơ tài khoản của người dùng hiện tại.',
    schema: z.object({}).strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (_args: Record<string, never>, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.users.getProfile(ctx.userId);
    },
    summarize: () => 'Xem thông tin tài khoản cá nhân',
  };

  // 2. update_my_profile
  const updateMyProfileBaseSchema = z
    .object({
      name: z.string().min(1).max(100).optional(),
      phone: z.string().regex(PHONE_REGEX, 'Số điện thoại không hợp lệ').optional(),
    })
    .strict();

  const updateMyProfileSchema = updateMyProfileBaseSchema;

  const updateMyProfileTool: AgentToolDef = {
    name: 'update_my_profile',
    domain: 'account',
    description:
      'Cập nhật thông tin hồ sơ tài khoản (tên hoặc số điện thoại). Cần cung cấp ít nhất một trường.',
    schema: updateMyProfileSchema,
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (
      args: { name?: string; phone?: string },
      ctx: ToolContext,
    ) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      if (args.name === undefined && args.phone === undefined) {
        throw new Error('Ít nhất một trong hai trường name hoặc phone phải có');
      }
      const fields: { name?: string; phone?: string } = {};
      if (args.name !== undefined) {
        fields.name = args.name;
      }
      if (args.phone !== undefined) {
        fields.phone = args.phone;
      }
      return deps.users.updateProfile(ctx.userId, fields);
    },
    summarize: (args: { name?: string; phone?: string }) => {
      const parts: string[] = [];
      if (args?.name) {
        parts.push(`tên: ${args.name}`);
      }
      if (args?.phone) {
        parts.push(`số điện thoại: ${args.phone}`);
      }
      if (parts.length === 0) {
        return 'Cập nhật thông tin tài khoản cá nhân';
      }
      return `Cập nhật thông tin tài khoản: ${parts.join(', ')}`;
    },
  };

  // 3. list_my_addresses
  const listMyAddressesTool: AgentToolDef = {
    name: 'list_my_addresses',
    domain: 'account',
    description: 'Danh sách địa chỉ nhận hàng của người dùng hiện tại.',
    schema: z.object({}).strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (_args: Record<string, never>, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.users.getAddresses(ctx.userId);
    },
    summarize: () => 'Xem danh sách địa chỉ nhận hàng',
    project: (result: unknown) => projectList(result, projectAddress),
  };

  // 4. create_address
  const createAddressSchema = z
    .object({
      fullName: z.string().min(1).max(100),
      phone: z.string().regex(PHONE_REGEX, 'Số điện thoại không hợp lệ'),
      province: z.string().min(1).max(100),
      district: z.string().min(1).max(100),
      ward: z.string().min(1).max(100),
      line1: z.string().min(1).max(200),
      isDefault: z.boolean().optional(),
    })
    .strict();

  const createAddressTool: AgentToolDef = {
    name: 'create_address',
    domain: 'account',
    description: 'Tạo địa chỉ nhận hàng mới cho người dùng hiện tại.',
    schema: createAddressSchema,
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (
      args: {
        fullName: string;
        phone: string;
        province: string;
        district: string;
        ward: string;
        line1: string;
        isDefault?: boolean;
      },
      ctx: ToolContext,
    ) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      const dto: {
        fullName: string;
        phone: string;
        province: string;
        district: string;
        ward: string;
        line1: string;
        isDefault?: boolean;
      } = {
        fullName: args.fullName,
        phone: args.phone,
        province: args.province,
        district: args.district,
        ward: args.ward,
        line1: args.line1,
      };
      if (args.isDefault !== undefined) {
        dto.isDefault = args.isDefault;
      }
      return deps.users.createAddress(ctx.userId, dto);
    },
    summarize: (args: {
      fullName?: string;
      line1?: string;
      province?: string;
      isDefault?: boolean;
    }) => {
      const parts: string[] = [];
      if (args?.fullName) {
        parts.push(`người nhận: ${args.fullName}`);
      }
      if (args?.line1) {
        parts.push(`địa chỉ: ${args.line1}`);
      }
      if (args?.province) {
        parts.push(`tỉnh/thành: ${args.province}`);
      }
      if (args?.isDefault !== undefined) {
        parts.push(args.isDefault ? 'đặt làm mặc định' : 'không đặt làm mặc định');
      } else {
        parts.push('không đặt làm mặc định');
      }
      if (parts.length === 0) {
        return 'Thêm địa chỉ giao hàng mới';
      }
      return `Thêm địa chỉ giao hàng: ${parts.join(', ')}`;
    },
    project: (result: unknown) => projectAddress(result),
  };

  // 5. update_address
  const updateAddressBaseSchema = z
    .object({
      addressId: z.string().min(1).max(64),
      fullName: z.string().min(1).max(100).optional(),
      phone: z.string().regex(PHONE_REGEX, 'Số điện thoại không hợp lệ').optional(),
      province: z.string().min(1).max(100).optional(),
      district: z.string().min(1).max(100).optional(),
      ward: z.string().min(1).max(100).optional(),
      line1: z.string().min(1).max(200).optional(),
      isDefault: z.boolean().optional(),
    })
    .strict();

  const updateAddressSchema = updateAddressBaseSchema;

  const updateAddressTool: AgentToolDef = {
    name: 'update_address',
    domain: 'account',
    description:
      'Cập nhật thông tin địa chỉ nhận hàng. Cần cung cấp ít nhất một trường ngoài addressId.',
    schema: updateAddressSchema,
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (
      args: {
        addressId: string;
        fullName?: string;
        phone?: string;
        province?: string;
        district?: string;
        ward?: string;
        line1?: string;
        isDefault?: boolean;
      },
      ctx: ToolContext,
    ) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      const fields: {
        fullName?: string;
        phone?: string;
        province?: string;
        district?: string;
        ward?: string;
        line1?: string;
        isDefault?: boolean;
      } = {};
      if (args.fullName !== undefined) fields.fullName = args.fullName;
      if (args.phone !== undefined) fields.phone = args.phone;
      if (args.province !== undefined) fields.province = args.province;
      if (args.district !== undefined) fields.district = args.district;
      if (args.ward !== undefined) fields.ward = args.ward;
      if (args.line1 !== undefined) fields.line1 = args.line1;
      if (args.isDefault !== undefined) fields.isDefault = args.isDefault;

      if (Object.keys(fields).length === 0) {
        throw new Error('Cần ít nhất một trường để cập nhật địa chỉ');
      }

      return deps.users.updateAddress(ctx.userId, args.addressId, fields);
    },
    summarize: (args: {
      addressId?: string;
      fullName?: string;
      phone?: string;
      province?: string;
      district?: string;
      ward?: string;
      line1?: string;
      isDefault?: boolean;
    }) => {
      const parts: string[] = [];
      if (args?.fullName !== undefined) {
        parts.push(`người nhận: ${args.fullName}`);
      }
      if (args?.phone !== undefined) {
        parts.push(`số điện thoại: ${args.phone}`);
      }
      if (args?.line1 !== undefined) {
        parts.push(`địa chỉ: ${args.line1}`);
      }
      if (args?.ward !== undefined) {
        parts.push(`phường/xã: ${args.ward}`);
      }
      if (args?.district !== undefined) {
        parts.push(`quận/huyện: ${args.district}`);
      }
      if (args?.province !== undefined) {
        parts.push(`tỉnh/thành: ${args.province}`);
      }
      if (args?.isDefault !== undefined) {
        parts.push(args.isDefault ? 'đặt làm mặc định' : 'không đặt làm mặc định');
      }
      const addrId = args?.addressId ? ` ${args.addressId}` : '';
      if (parts.length === 0) {
        return `Cập nhật địa chỉ nhận hàng${addrId}`.trim();
      }
      return `Cập nhật địa chỉ nhận hàng${addrId}: ${parts.join(', ')}`;
    },
    project: (result: unknown) => projectAddress(result),
  };

  // 6. delete_address
  const deleteAddressTool: AgentToolDef = {
    name: 'delete_address',
    domain: 'account',
    description: 'Xóa địa chỉ. Không hoàn tác được.',
    schema: z
      .object({
        addressId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'customer',
    risk: 'DESTRUCTIVE',
    handler: async (args: { addressId: string }, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.users.deleteAddress(ctx.userId, args.addressId);
    },
    summarize: (args) => `Xóa địa chỉ ${args.addressId}`,
  };

  // 7. get_referral_info
  const getReferralInfoTool: AgentToolDef = {
    name: 'get_referral_info',
    domain: 'account',
    description:
      'Xem thông tin mã giới thiệu và số lượng bạn bè đã mời. Lần đầu gọi công cụ này có thể tự động tạo mã giới thiệu nếu chưa có.',
    schema: z.object({}).strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (_args: Record<string, never>, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.referrals.getMyReferralInfo(ctx.userId);
    },
    summarize: () => 'Xem thông tin mã giới thiệu cá nhân',
  };

  // 8. list_my_referrals
  const listMyReferralsTool: AgentToolDef = {
    name: 'list_my_referrals',
    domain: 'account',
    description: 'Danh sách bạn bè đã được giới thiệu kèm phân trang.',
    schema: z
      .object({
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (
      args: { page?: number; limit?: number },
      ctx: ToolContext,
    ) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.referrals.getMyReferrals(ctx.userId, {
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.page
        ? `Xem danh sách người được giới thiệu (trang ${args.page})`
        : 'Xem danh sách người được giới thiệu',
    project: (result: unknown) => projectList(result),
  };

  // 9. list_my_referral_coupons
  const listMyReferralCouponsTool: AgentToolDef = {
    name: 'list_my_referral_coupons',
    domain: 'account',
    description:
      'Xem danh sách mã giảm giá nhận được từ chương trình giới thiệu.',
    schema: z.object({}).strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (_args: Record<string, never>, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.referrals.getMyCouponsFromReferral(ctx.userId);
    },
    summarize: () => 'Xem danh sách mã giảm giá từ giới thiệu',
    project: (result: unknown) => projectList(result),
  };

  return [
    getMyProfileTool,
    updateMyProfileTool,
    listMyAddressesTool,
    createAddressTool,
    updateAddressTool,
    deleteAddressTool,
    getReferralInfoTool,
    listMyReferralsTool,
    listMyReferralCouponsTool,
  ];
}
