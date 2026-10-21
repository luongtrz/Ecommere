import { createAccountTools, AccountToolDeps } from './account.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import type { UsersService } from '../../../users/users.service';
import type { ReferralsService } from '../../../referrals/referrals.service';

describe('Account Tools', () => {
  let mockUsersService: {
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
    getAddresses: jest.Mock;
    createAddress: jest.Mock;
    updateAddress: jest.Mock;
    deleteAddress: jest.Mock;
  };

  let mockReferralsService: {
    getMyReferralInfo: jest.Mock;
    getMyReferrals: jest.Mock;
    getMyCouponsFromReferral: jest.Mock;
  };

  let tools: AgentToolDef[];
  let getMyProfileTool: AgentToolDef;
  let updateMyProfileTool: AgentToolDef;
  let listMyAddressesTool: AgentToolDef;
  let createAddressTool: AgentToolDef;
  let updateAddressTool: AgentToolDef;
  let deleteAddressTool: AgentToolDef;
  let getReferralInfoTool: AgentToolDef;
  let listMyReferralsTool: AgentToolDef;
  let listMyReferralCouponsTool: AgentToolDef;

  const validCustomerCtx: ToolContext = {
    userId: 'user-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-customer-1',
  };

  const unauthenticatedCtx: ToolContext = {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: 'thread-guest-1',
  };

  const validAddressPayload = {
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Dịch Vọng Hậu',
    line1: '123 Đường Cầu Giấy',
    isDefault: true,
  };

  beforeEach(() => {
    mockUsersService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getAddresses: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
    };

    mockReferralsService = {
      getMyReferralInfo: jest.fn(),
      getMyReferrals: jest.fn(),
      getMyCouponsFromReferral: jest.fn(),
    };

    const deps: AccountToolDeps = {
      users: mockUsersService as unknown as UsersService,
      referrals: mockReferralsService as unknown as ReferralsService,
    };

    tools = createAccountTools(deps);
    getMyProfileTool = tools.find((t) => t.name === 'get_my_profile')!;
    updateMyProfileTool = tools.find((t) => t.name === 'update_my_profile')!;
    listMyAddressesTool = tools.find((t) => t.name === 'list_my_addresses')!;
    createAddressTool = tools.find((t) => t.name === 'create_address')!;
    updateAddressTool = tools.find((t) => t.name === 'update_address')!;
    deleteAddressTool = tools.find((t) => t.name === 'delete_address')!;
    getReferralInfoTool = tools.find((t) => t.name === 'get_referral_info')!;
    listMyReferralsTool = tools.find((t) => t.name === 'list_my_referrals')!;
    listMyReferralCouponsTool = tools.find(
      (t) => t.name === 'list_my_referral_coupons',
    )!;
  });

  describe('Factory and General Requirements', () => {
    it('returns exactly 9 tools with unique names', () => {
      expect(tools).toHaveLength(9);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(9);
      expect(names).toEqual([
        'get_my_profile',
        'update_my_profile',
        'list_my_addresses',
        'create_address',
        'update_address',
        'delete_address',
        'get_referral_info',
        'list_my_referrals',
        'list_my_referral_coupons',
      ]);
    });

    it('sets auth to "customer" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('customer');
      }
    });

    it('sets domain to "account" on all tools', () => {
      for (const tool of tools) {
        expect(tool.domain).toBe('account');
      }
    });

    it('assigns correct risk levels: delete_address is DESTRUCTIVE, personal write tools are SENSITIVE, read tools are READ', () => {
      expect(deleteAddressTool.risk).toBe('DESTRUCTIVE');
      expect(updateMyProfileTool.risk).toBe('SENSITIVE');
      expect(createAddressTool.risk).toBe('SENSITIVE');
      expect(updateAddressTool.risk).toBe('SENSITIVE');

      expect(getMyProfileTool.risk).toBe('READ');
      expect(listMyAddressesTool.risk).toBe('READ');
      expect(getReferralInfoTool.risk).toBe('READ');
      expect(listMyReferralsTool.risk).toBe('READ');
      expect(listMyReferralCouponsTool.risk).toBe('READ');
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

        const checkRole = tool.schema.safeParse({ role: 'CUSTOMER' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('throws "Cần đăng nhập để dùng chức năng này" for all tools when ctx.userId is null', async () => {
      await expect(
        getMyProfileTool.handler({}, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        updateMyProfileTool.handler({ name: 'Alex' }, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        listMyAddressesTool.handler({}, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        createAddressTool.handler(validAddressPayload, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        updateAddressTool.handler(
          { addressId: 'addr-1', fullName: 'B' },
          unauthenticatedCtx,
        ),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        deleteAddressTool.handler({ addressId: 'addr-1' }, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        getReferralInfoTool.handler({}, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        listMyReferralsTool.handler({}, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        listMyReferralCouponsTool.handler({}, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
    });

    it('ensures each tool has a summarize function returning a short Vietnamese string', () => {
      for (const tool of tools) {
        const summary = tool.summarize({
          addressId: 'addr-1',
          page: 1,
          province: 'Hà Nội',
        });
        expect(typeof summary).toBe('string');
        expect(summary.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('get_my_profile', () => {
    it('has risk READ and calls users.getProfile with ctx.userId', async () => {
      expect(getMyProfileTool.risk).toBe('READ');
      mockUsersService.getProfile.mockResolvedValue({
        id: 'user-123',
        name: 'Nguyễn Văn A',
        email: 'user@example.com',
      });

      const result = await getMyProfileTool.handler({}, validCustomerCtx);

      expect(mockUsersService.getProfile).toHaveBeenCalledTimes(1);
      expect(mockUsersService.getProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        id: 'user-123',
        name: 'Nguyễn Văn A',
        email: 'user@example.com',
      });
    });

    it('summarize returns a Vietnamese string', () => {
      expect(getMyProfileTool.summarize({})).toBe(
        'Xem thông tin tài khoản cá nhân',
      );
    });
  });

  describe('update_my_profile', () => {
    it('has risk SENSITIVE and calls users.updateProfile with only provided fields', async () => {
      expect(updateMyProfileTool.risk).toBe('SENSITIVE');
      mockUsersService.updateProfile.mockResolvedValue({
        id: 'user-123',
        name: 'Nguyễn Văn B',
        phone: '0912345678',
      });

      // Update both name and phone
      await updateMyProfileTool.handler(
        { name: 'Nguyễn Văn B', phone: '0912345678' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-123', {
        name: 'Nguyễn Văn B',
        phone: '0912345678',
      });

      // Update name only
      mockUsersService.updateProfile.mockClear();
      await updateMyProfileTool.handler(
        { name: 'Nguyễn Văn C' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-123', {
        name: 'Nguyễn Văn C',
      });

      // Update phone only
      mockUsersService.updateProfile.mockClear();
      await updateMyProfileTool.handler(
        { phone: '0987654321' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-123', {
        phone: '0987654321',
      });
    });

    it('rejects a call with no fields in handler', async () => {
      await expect(
        updateMyProfileTool.handler({}, validCustomerCtx),
      ).rejects.toThrow('Ít nhất một trong hai trường name hoặc phone phải có');
    });

    it('rejects a phone that does not match the regex', () => {
      const invalidPhones = [
        '1234567890',
        '09123',
        '+841234',
        '0123456789012',
        'abc0912345678',
        '',
      ];
      for (const phone of invalidPhones) {
        const res = updateMyProfileTool.schema.safeParse({ phone });
        expect(res.success).toBe(false);
      }
    });

    it('accepts valid phone formats matching PHONE_REGEX', () => {
      const validPhones = [
        '0912345678',
        '09123456789',
        '+84912345678',
        '+849123456789',
      ];
      for (const phone of validPhones) {
        const res = updateMyProfileTool.schema.safeParse({ phone });
        expect(res.success).toBe(true);
      }
    });

    it('rejects name longer than 100 characters', () => {
      const res = updateMyProfileTool.schema.safeParse({
        name: 'a'.repeat(101),
      });
      expect(res.success).toBe(false);
    });

    it('summarize returns a Vietnamese string naming provided fields', () => {
      expect(updateMyProfileTool.summarize({})).toBe(
        'Cập nhật thông tin tài khoản cá nhân',
      );
      expect(
        updateMyProfileTool.summarize({
          name: 'Nguyễn Văn B',
          phone: '0912345678',
        }),
      ).toBe(
        'Cập nhật thông tin tài khoản: tên: Nguyễn Văn B, số điện thoại: 0912345678',
      );
      expect(
        updateMyProfileTool.summarize({
          name: 'Nguyễn Văn C',
        }),
      ).toBe('Cập nhật thông tin tài khoản: tên: Nguyễn Văn C');
      expect(
        updateMyProfileTool.summarize({
          phone: '0987654321',
        }),
      ).toBe('Cập nhật thông tin tài khoản: số điện thoại: 0987654321');
    });
  });

  describe('list_my_addresses', () => {
    it('has risk READ and calls users.getAddresses with ctx.userId', async () => {
      expect(listMyAddressesTool.risk).toBe('READ');
      mockUsersService.getAddresses.mockResolvedValue([
        { id: 'addr-1', line1: '123 Đường A' },
      ]);

      const result = await listMyAddressesTool.handler({}, validCustomerCtx);

      expect(mockUsersService.getAddresses).toHaveBeenCalledTimes(1);
      expect(mockUsersService.getAddresses).toHaveBeenCalledWith('user-123');
      expect(result).toEqual([{ id: 'addr-1', line1: '123 Đường A' }]);
    });

    it('project() keeps at most 10 items and strips all non-address fields including userId', () => {
      const twelveAddresses = Array.from({ length: 12 }, (_, i) => ({
        id: `addr-${i + 1}`,
        userId: 'user-123',
        fullName: `User ${i + 1}`,
        phone: '0912345678',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: `${i + 1} Xuân Thủy`,
        isDefault: i === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        extraField: 'should-be-omitted',
        user: { name: 'User' },
      }));

      const projected = listMyAddressesTool.project!(twelveAddresses) as Array<
        Record<string, unknown>
      >;
      expect(projected).toHaveLength(10);
      expect(projected[0].id).toBe('addr-1');
      expect(projected[9].id).toBe('addr-10');

      for (const addr of projected) {
        expect(addr).not.toHaveProperty('userId');
        expect(addr).not.toHaveProperty('user');
        expect(addr).not.toHaveProperty('extraField');
        expect(addr).toHaveProperty('id');
        expect(addr).toHaveProperty('fullName');
        expect(addr).toHaveProperty('phone');
        expect(addr).toHaveProperty('province');
        expect(addr).toHaveProperty('district');
        expect(addr).toHaveProperty('ward');
        expect(addr).toHaveProperty('line1');
        expect(addr).toHaveProperty('isDefault');
      }
    });

    it('summarize returns a Vietnamese string', () => {
      expect(listMyAddressesTool.summarize({})).toBe(
        'Xem danh sách địa chỉ nhận hàng',
      );
    });
  });

  describe('create_address', () => {
    it('has risk SENSITIVE and calls users.createAddress with expected arguments', async () => {
      expect(createAddressTool.risk).toBe('SENSITIVE');
      mockUsersService.createAddress.mockResolvedValue({
        id: 'addr-new',
        ...validAddressPayload,
      });

      const result = await createAddressTool.handler(
        validAddressPayload,
        validCustomerCtx,
      );

      expect(mockUsersService.createAddress).toHaveBeenCalledTimes(1);
      expect(mockUsersService.createAddress).toHaveBeenCalledWith(
        'user-123',
        validAddressPayload,
      );
      expect(result).toEqual({
        id: 'addr-new',
        ...validAddressPayload,
      });
    });

    it('rejects an extra key (strict)', () => {
      const payloadWithExtra = {
        ...validAddressPayload,
        extraProp: 'forbidden',
      };
      const res = createAddressTool.schema.safeParse(payloadWithExtra);
      expect(res.success).toBe(false);
    });

    it('rejects an invalid phone format', () => {
      const payloadWithBadPhone = {
        ...validAddressPayload,
        phone: '1234567890',
      };
      const res = createAddressTool.schema.safeParse(payloadWithBadPhone);
      expect(res.success).toBe(false);
    });

    it('validates string length limits for address fields', () => {
      expect(
        createAddressTool.schema.safeParse({
          ...validAddressPayload,
          fullName: 'a'.repeat(101),
        }).success,
      ).toBe(false);
      expect(
        createAddressTool.schema.safeParse({
          ...validAddressPayload,
          province: 'a'.repeat(101),
        }).success,
      ).toBe(false);
      expect(
        createAddressTool.schema.safeParse({
          ...validAddressPayload,
          district: 'a'.repeat(101),
        }).success,
      ).toBe(false);
      expect(
        createAddressTool.schema.safeParse({
          ...validAddressPayload,
          ward: 'a'.repeat(101),
        }).success,
      ).toBe(false);
      expect(
        createAddressTool.schema.safeParse({
          ...validAddressPayload,
          line1: 'a'.repeat(201),
        }).success,
      ).toBe(false);
    });

    it('project() strips userId and non-address fields from created address', () => {
      const createdRaw = {
        id: 'addr-new',
        userId: 'user-123',
        ...validAddressPayload,
        secretToken: 'secret',
      };

      const projected = createAddressTool.project!(createdRaw) as Record<
        string,
        unknown
      >;
      expect(projected).not.toHaveProperty('userId');
      expect(projected).not.toHaveProperty('secretToken');
      expect(projected.id).toBe('addr-new');
      expect(projected.line1).toBe(validAddressPayload.line1);
    });

    it('summarize returns a Vietnamese string with recipient, address line, province, and default status', () => {
      expect(createAddressTool.summarize(validAddressPayload)).toBe(
        'Thêm địa chỉ giao hàng: người nhận: Nguyễn Văn A, địa chỉ: 123 Đường Cầu Giấy, tỉnh/thành: Hà Nội, đặt làm mặc định',
      );
      expect(
        createAddressTool.summarize({
          ...validAddressPayload,
          isDefault: false,
        }),
      ).toBe(
        'Thêm địa chỉ giao hàng: người nhận: Nguyễn Văn A, địa chỉ: 123 Đường Cầu Giấy, tỉnh/thành: Hà Nội, không đặt làm mặc định',
      );
    });
  });

  describe('update_address', () => {
    it('has risk SENSITIVE and calls users.updateAddress with (userId, addressId, fields)', async () => {
      expect(updateAddressTool.risk).toBe('SENSITIVE');
      mockUsersService.updateAddress.mockResolvedValue({
        id: 'addr-1',
        fullName: 'Nguyễn Văn C',
      });

      const args = {
        addressId: 'addr-1',
        fullName: 'Nguyễn Văn C',
        province: 'Đà Nẵng',
      };

      await updateAddressTool.handler(args, validCustomerCtx);

      expect(mockUsersService.updateAddress).toHaveBeenCalledTimes(1);
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-123',
        'addr-1',
        {
          fullName: 'Nguyễn Văn C',
          province: 'Đà Nẵng',
        },
      );
    });

    it('rejects a call with only addressId in handler', async () => {
      await expect(
        updateAddressTool.handler({ addressId: 'addr-1' }, validCustomerCtx),
      ).rejects.toThrow('Cần ít nhất một trường để cập nhật địa chỉ');
    });

    it('rejects an invalid phone format in update_address', () => {
      const res = updateAddressTool.schema.safeParse({
        addressId: 'addr-1',
        phone: 'invalid-phone',
      });
      expect(res.success).toBe(false);
    });

    it('rejects extra keys in update_address (strict)', () => {
      const res = updateAddressTool.schema.safeParse({
        addressId: 'addr-1',
        fullName: 'B',
        unknownKey: 'forbidden',
      });
      expect(res.success).toBe(false);
    });

    it('project() strips userId from updated address', () => {
      const updatedRaw = {
        id: 'addr-1',
        userId: 'user-123',
        fullName: 'Nguyễn Văn B',
        phone: '0912345678',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '123 Cầu Giấy',
        isDefault: false,
        extraData: 'foo',
      };

      const projected = updateAddressTool.project!(updatedRaw) as Record<
        string,
        unknown
      >;
      expect(projected).not.toHaveProperty('userId');
      expect(projected).not.toHaveProperty('extraData');
      expect(projected.id).toBe('addr-1');
    });

    it('summarize returns a Vietnamese string with addressId and provided fields', () => {
      expect(updateAddressTool.summarize({ addressId: 'addr-999' })).toBe(
        'Cập nhật địa chỉ nhận hàng addr-999',
      );
      expect(
        updateAddressTool.summarize({
          addressId: 'addr-1',
          fullName: 'Nguyễn Văn C',
          province: 'Đà Nẵng',
        }),
      ).toBe(
        'Cập nhật địa chỉ nhận hàng addr-1: người nhận: Nguyễn Văn C, tỉnh/thành: Đà Nẵng',
      );
      expect(
        updateAddressTool.summarize({
          addressId: 'addr-1',
          isDefault: true,
        }),
      ).toBe('Cập nhật địa chỉ nhận hàng addr-1: đặt làm mặc định');
      expect(
        updateAddressTool.summarize({
          addressId: 'addr-1',
          phone: '0912345678',
        }),
      ).toBe('Cập nhật địa chỉ nhận hàng addr-1: số điện thoại: 0912345678');
    });
  });

  describe('delete_address', () => {
    it('has risk DESTRUCTIVE, exact description, and calls users.deleteAddress', async () => {
      expect(deleteAddressTool.risk).toBe('DESTRUCTIVE');
      expect(deleteAddressTool.description).toBe(
        'Xóa địa chỉ. Không hoàn tác được.',
      );

      mockUsersService.deleteAddress.mockResolvedValue({
        message: 'Address deleted successfully',
      });

      const result = await deleteAddressTool.handler(
        { addressId: 'addr-123' },
        validCustomerCtx,
      );

      expect(mockUsersService.deleteAddress).toHaveBeenCalledTimes(1);
      expect(mockUsersService.deleteAddress).toHaveBeenCalledWith(
        'user-123',
        'addr-123',
      );
      expect(result).toEqual({ message: 'Address deleted successfully' });
    });

    it('validates addressId length constraints (1..64)', () => {
      expect(
        deleteAddressTool.schema.safeParse({ addressId: '' }).success,
      ).toBe(false);
      expect(
        deleteAddressTool.schema.safeParse({ addressId: 'a'.repeat(65) })
          .success,
      ).toBe(false);
      expect(
        deleteAddressTool.schema.safeParse({ addressId: 'addr-ok' }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string with addressId', () => {
      expect(deleteAddressTool.summarize({ addressId: 'addr-123' })).toBe(
        'Xóa địa chỉ addr-123',
      );
    });
  });

  describe('get_referral_info', () => {
    it('has risk READ, description notes possible code creation, and calls referrals.getMyReferralInfo', async () => {
      expect(getReferralInfoTool.risk).toBe('READ');
      expect(getReferralInfoTool.description).toMatch(/tạo mã giới thiệu/i);

      mockReferralsService.getMyReferralInfo.mockResolvedValue({
        referralCode: 'REF-123456',
        totalReferrals: 3,
        totalCouponsEarned: 3,
      });

      const result = await getReferralInfoTool.handler({}, validCustomerCtx);

      expect(mockReferralsService.getMyReferralInfo).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getMyReferralInfo).toHaveBeenCalledWith(
        'user-123',
      );
      expect(result).toEqual({
        referralCode: 'REF-123456',
        totalReferrals: 3,
        totalCouponsEarned: 3,
      });
    });

    it('summarize returns a Vietnamese string', () => {
      expect(getReferralInfoTool.summarize({})).toBe(
        'Xem thông tin mã giới thiệu cá nhân',
      );
    });
  });

  describe('list_my_referrals', () => {
    it('has risk READ and calls referrals.getMyReferrals with (userId, { page, limit })', async () => {
      expect(listMyReferralsTool.risk).toBe('READ');

      mockReferralsService.getMyReferrals.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 15,
        totalPages: 0,
      });

      await listMyReferralsTool.handler(
        { page: 2, limit: 15 },
        validCustomerCtx,
      );

      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledTimes(1);
      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledWith(
        'user-123',
        { page: 2, limit: 15 },
      );
    });

    it('validates page (1..50) and limit (1..100) range', () => {
      expect(listMyReferralsTool.schema.safeParse({ page: 0 }).success).toBe(
        false,
      );
      expect(listMyReferralsTool.schema.safeParse({ page: 51 }).success).toBe(
        false,
      );
      expect(listMyReferralsTool.schema.safeParse({ limit: 0 }).success).toBe(
        false,
      );
      expect(listMyReferralsTool.schema.safeParse({ limit: 101 }).success).toBe(
        false,
      );
      expect(
        listMyReferralsTool.schema.safeParse({ page: 1, limit: 100 }).success,
      ).toBe(true);
    });

    it('project() keeps at most 10 items in data array', () => {
      const twelveReferrals = {
        data: Array.from({ length: 12 }, (_, i) => ({
          id: `ref-${i + 1}`,
          refereeName: `User ${i + 1}`,
        })),
        total: 12,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const projected = listMyReferralsTool.project!(
        twelveReferrals,
      ) as typeof twelveReferrals;
      expect(projected.data).toHaveLength(10);
      expect(projected.data[0].id).toBe('ref-1');
      expect(projected.data[9].id).toBe('ref-10');
      expect(projected.total).toBe(12);
    });

    it('summarize returns a Vietnamese string', () => {
      expect(listMyReferralsTool.summarize({})).toBe(
        'Xem danh sách người được giới thiệu',
      );
      expect(listMyReferralsTool.summarize({ page: 2 })).toBe(
        'Xem danh sách người được giới thiệu (trang 2)',
      );
    });
  });

  describe('list_my_referral_coupons', () => {
    it('has risk READ and calls referrals.getMyCouponsFromReferral with userId', async () => {
      expect(listMyReferralCouponsTool.risk).toBe('READ');

      mockReferralsService.getMyCouponsFromReferral.mockResolvedValue({
        data: [{ id: 'cpn-1', code: 'REF-ER-123' }],
      });

      const result = await listMyReferralCouponsTool.handler(
        {},
        validCustomerCtx,
      );

      expect(
        mockReferralsService.getMyCouponsFromReferral,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockReferralsService.getMyCouponsFromReferral,
      ).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        data: [{ id: 'cpn-1', code: 'REF-ER-123' }],
      });
    });

    it('project() keeps at most 10 items in data array', () => {
      const twelveCoupons = {
        data: Array.from({ length: 12 }, (_, i) => ({
          id: `cpn-${i + 1}`,
          code: `REF-COUPON-${i + 1}`,
        })),
      };

      const projected = listMyReferralCouponsTool.project!(
        twelveCoupons,
      ) as typeof twelveCoupons;
      expect(projected.data).toHaveLength(10);
      expect(projected.data[0].id).toBe('cpn-1');
      expect(projected.data[9].id).toBe('cpn-10');
    });

    it('summarize returns a Vietnamese string', () => {
      expect(listMyReferralCouponsTool.summarize({})).toBe(
        'Xem danh sách mã giảm giá từ giới thiệu',
      );
    });
  });
});
