import { createAccountTools, AccountToolDeps } from './account.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import type { UsersService } from '../../../users/users.service';
import type { ReferralsService } from '../../../referrals/referrals.service';

describe('Account Tools - Branch Gaps Coverage', () => {
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
  let updateMyProfileTool: AgentToolDef;
  let listMyAddressesTool: AgentToolDef;
  let createAddressTool: AgentToolDef;
  let updateAddressTool: AgentToolDef;
  let listMyReferralsTool: AgentToolDef;
  let listMyReferralCouponsTool: AgentToolDef;

  const validCustomerCtx: ToolContext = {
    userId: 'user-gap-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-gap-1',
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
    updateMyProfileTool = tools.find((t) => t.name === 'update_my_profile')!;
    listMyAddressesTool = tools.find((t) => t.name === 'list_my_addresses')!;
    createAddressTool = tools.find((t) => t.name === 'create_address')!;
    updateAddressTool = tools.find((t) => t.name === 'update_address')!;
    listMyReferralsTool = tools.find((t) => t.name === 'list_my_referrals')!;
    listMyReferralCouponsTool = tools.find(
      (t) => t.name === 'list_my_referral_coupons',
    )!;
  });

  describe('projectAddress & projectList branch gaps', () => {
    it('projectAddress returns non-object or falsy input untouched', () => {
      // create_address uses project: (result) => projectAddress(result)
      expect(createAddressTool.project!(null)).toBeNull();
      expect(createAddressTool.project!(undefined)).toBeUndefined();
      expect(createAddressTool.project!('simple-string')).toBe('simple-string');
      expect(createAddressTool.project!(12345)).toBe(12345);
      expect(createAddressTool.project!(true)).toBe(true);
    });

    it('projectAddress preserves createdAt and updatedAt when present, and omits them when undefined', () => {
      // Case 1: without createdAt and updatedAt
      const addrWithoutDates = {
        id: 'addr-no-dates',
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        province: 'Ha Noi',
        district: 'Ba Dinh',
        ward: 'Kim Ma',
        line1: '1 Kim Ma',
        isDefault: false,
      };
      const proj1 = createAddressTool.project!(addrWithoutDates) as any;
      expect(proj1).not.toHaveProperty('createdAt');
      expect(proj1).not.toHaveProperty('updatedAt');
      expect(proj1.id).toBe('addr-no-dates');

      // Case 2: with createdAt only
      const addrWithCreatedAt = {
        ...addrWithoutDates,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      const proj2 = createAddressTool.project!(addrWithCreatedAt) as any;
      expect(proj2.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
      expect(proj2).not.toHaveProperty('updatedAt');

      // Case 3: with updatedAt only
      const addrWithUpdatedAt = {
        ...addrWithoutDates,
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      };
      const proj3 = createAddressTool.project!(addrWithUpdatedAt) as any;
      expect(proj3).not.toHaveProperty('createdAt');
      expect(proj3.updatedAt).toEqual(new Date('2026-02-01T00:00:00Z'));
    });

    it('projectList returns non-object or falsy result untouched', () => {
      // list_my_referrals uses project: (result) => projectList(result)
      expect(listMyReferralsTool.project!(null)).toBeNull();
      expect(listMyReferralsTool.project!(undefined)).toBeUndefined();
      expect(listMyReferralsTool.project!('non-object-string')).toBe(
        'non-object-string',
      );
      expect(listMyReferralsTool.project!(999)).toBe(999);
    });

    it('projectList returns object unchanged if it is neither an array nor has a data array', () => {
      const customObject = { status: 'success', count: 0 };
      expect(listMyReferralsTool.project!(customObject)).toEqual(customObject);
    });

    it('projectList handles a direct array without an itemProjector', () => {
      const rawList = [1, 2, 3, 4, 5];
      const res = listMyReferralsTool.project!(rawList);
      expect(res).toEqual([1, 2, 3, 4, 5]);
    });

    it('projectList maps items inside data array when an itemProjector is supplied', () => {
      // list_my_addresses uses projectList with projectAddress
      const paginatedAddresses = {
        data: [
          {
            id: 'addr-p1',
            userId: 'user-to-strip',
            fullName: 'Le Van C',
            phone: '0912345678',
            province: 'Hue',
            district: 'Hue',
            ward: 'Phu Hoi',
            line1: '10 Hung Vuong',
            isDefault: true,
            extraField: 'should-be-omitted',
          },
        ],
        total: 1,
      };

      const res = listMyAddressesTool.project!(paginatedAddresses) as any;
      expect(res.total).toBe(1);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe('addr-p1');
      expect(res.data[0]).not.toHaveProperty('userId');
      expect(res.data[0]).not.toHaveProperty('extraField');
    });

    it('projectList slices at 10 for arrays without itemProjector', () => {
      const fifteenItems = Array.from({ length: 15 }, (_, i) => ({
        id: `item-${i + 1}`,
      }));
      const res = listMyReferralCouponsTool.project!(fifteenItems) as any[];
      expect(res).toHaveLength(10);
      expect(res[0].id).toBe('item-1');
      expect(res[9].id).toBe('item-10');
    });
  });

  describe('create_address branch gaps', () => {
    it('creates address without isDefault when isDefault is omitted in args', async () => {
      const payloadWithoutDefault = {
        fullName: 'Nguyen Thi D',
        phone: '0912345678',
        province: 'Da Nang',
        district: 'Hai Chau',
        ward: 'Thach Thang',
        line1: '99 Tran Phu',
      };

      mockUsersService.createAddress.mockResolvedValue({
        id: 'addr-no-default',
        ...payloadWithoutDefault,
      });

      await createAddressTool.handler(payloadWithoutDefault, validCustomerCtx);

      expect(mockUsersService.createAddress).toHaveBeenCalledWith(
        'user-gap-123',
        {
          fullName: 'Nguyen Thi D',
          phone: '0912345678',
          province: 'Da Nang',
          district: 'Hai Chau',
          ward: 'Thach Thang',
          line1: '99 Tran Phu',
        },
      );
      // Ensure isDefault property was NOT defined on the dto
      const passedDto = mockUsersService.createAddress.mock.calls[0][1];
      expect(passedDto).not.toHaveProperty('isDefault');
    });

    it('summarize handles undefined isDefault (defaults to "không đặt làm mặc định")', () => {
      const summary = createAddressTool.summarize({
        fullName: 'Le Van E',
        line1: '12 Nguyen Hue',
        province: 'TP.HCM',
        // isDefault is omitted
      });
      expect(summary).toBe(
        'Thêm địa chỉ giao hàng: người nhận: Le Van E, địa chỉ: 12 Nguyen Hue, tỉnh/thành: TP.HCM, không đặt làm mặc định',
      );
    });

    it('summarize handles partial fields when fullName, line1, or province are missing', () => {
      const summaryFullNameOnly = createAddressTool.summarize({
        fullName: 'Pham Van F',
      });
      expect(summaryFullNameOnly).toBe(
        'Thêm địa chỉ giao hàng: người nhận: Pham Van F, không đặt làm mặc định',
      );

      const summaryLine1Only = createAddressTool.summarize({
        line1: '50 Vo Van Tan',
      });
      expect(summaryLine1Only).toBe(
        'Thêm địa chỉ giao hàng: địa chỉ: 50 Vo Van Tan, không đặt làm mặc định',
      );

      const summaryProvinceOnly = createAddressTool.summarize({
        province: 'Can Tho',
      });
      expect(summaryProvinceOnly).toBe(
        'Thêm địa chỉ giao hàng: tỉnh/thành: Can Tho, không đặt làm mặc định',
      );
    });
  });

  describe('update_address branch gaps', () => {
    it('exercises all optional fields in update_address handler (phone, district, ward, line1, isDefault)', async () => {
      mockUsersService.updateAddress.mockResolvedValue({ id: 'addr-gap' });

      // Update phone only
      await updateAddressTool.handler(
        { addressId: 'addr-gap', phone: '0987654321' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        { phone: '0987654321' },
      );

      // Update district only
      mockUsersService.updateAddress.mockClear();
      await updateAddressTool.handler(
        { addressId: 'addr-gap', district: 'Thanh Xuan' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        { district: 'Thanh Xuan' },
      );

      // Update ward only
      mockUsersService.updateAddress.mockClear();
      await updateAddressTool.handler(
        { addressId: 'addr-gap', ward: 'Nhan Chinh' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        { ward: 'Nhan Chinh' },
      );

      // Update line1 only
      mockUsersService.updateAddress.mockClear();
      await updateAddressTool.handler(
        { addressId: 'addr-gap', line1: '88 Le Van Luong' },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        { line1: '88 Le Van Luong' },
      );

      // Update isDefault (true and false)
      mockUsersService.updateAddress.mockClear();
      await updateAddressTool.handler(
        { addressId: 'addr-gap', isDefault: false },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        { isDefault: false },
      );

      mockUsersService.updateAddress.mockClear();
      await updateAddressTool.handler(
        { addressId: 'addr-gap', isDefault: true },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        { isDefault: true },
      );

      // Update all fields together
      mockUsersService.updateAddress.mockClear();
      await updateAddressTool.handler(
        {
          addressId: 'addr-gap',
          fullName: 'Hoang Van G',
          phone: '0912345678',
          province: 'Ha Noi',
          district: 'Cau Giay',
          ward: 'Dich Vong',
          line1: '100 Xuan Thuy',
          isDefault: true,
        },
        validCustomerCtx,
      );
      expect(mockUsersService.updateAddress).toHaveBeenCalledWith(
        'user-gap-123',
        'addr-gap',
        {
          fullName: 'Hoang Van G',
          phone: '0912345678',
          province: 'Ha Noi',
          district: 'Cau Giay',
          ward: 'Dich Vong',
          line1: '100 Xuan Thuy',
          isDefault: true,
        },
      );
    });

    it('summarize covers line1, ward, district, isDefault=false, and missing addressId', () => {
      // line1, ward, district
      const summaryFields = updateAddressTool.summarize({
        addressId: 'addr-1',
        line1: '12 Phố Huế',
        ward: 'Hàng Bài',
        district: 'Hoàn Kiếm',
      });
      expect(summaryFields).toBe(
        'Cập nhật địa chỉ nhận hàng addr-1: địa chỉ: 12 Phố Huế, phường/xã: Hàng Bài, quận/huyện: Hoàn Kiếm',
      );

      // isDefault = false
      const summaryNotDefault = updateAddressTool.summarize({
        addressId: 'addr-2',
        isDefault: false,
      });
      expect(summaryNotDefault).toBe(
        'Cập nhật địa chỉ nhận hàng addr-2: không đặt làm mặc định',
      );

      // addressId missing with fields
      const summaryNoAddrId = updateAddressTool.summarize({
        fullName: 'Vo Van H',
      });
      expect(summaryNoAddrId).toBe(
        'Cập nhật địa chỉ nhận hàng: người nhận: Vo Van H',
      );

      // addressId missing without any fields (parts.length === 0)
      const summaryEmpty = updateAddressTool.summarize({});
      expect(summaryEmpty).toBe('Cập nhật địa chỉ nhận hàng');

      // addressId empty string without any fields
      const summaryEmptyId = updateAddressTool.summarize({ addressId: '' });
      expect(summaryEmptyId).toBe('Cập nhật địa chỉ nhận hàng');
    });
  });

  describe('update_my_profile & list_my_referrals branch gaps', () => {
    it('summarize returns fallback when update_my_profile args has no fields', () => {
      expect(updateMyProfileTool.summarize({})).toBe(
        'Cập nhật thông tin tài khoản cá nhân',
      );
    });

    it('list_my_referrals handler handles empty arguments (page and limit undefined)', async () => {
      mockReferralsService.getMyReferrals.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await listMyReferralsTool.handler({}, validCustomerCtx);

      expect(mockReferralsService.getMyReferrals).toHaveBeenCalledWith(
        'user-gap-123',
        { page: undefined, limit: undefined },
      );
    });

    it('list_my_referrals summarize handles undefined or falsy page', () => {
      expect(listMyReferralsTool.summarize({})).toBe(
        'Xem danh sách người được giới thiệu',
      );
      expect(listMyReferralsTool.summarize({ page: undefined })).toBe(
        'Xem danh sách người được giới thiệu',
      );
    });
  });
});
