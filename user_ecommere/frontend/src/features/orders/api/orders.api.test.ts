import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import { parseAddressJson, ordersApi } from './orders.api';

vi.mock('@/lib/api', () => {
  const mockClient = {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockClient,
    apiClient: mockClient,
  };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
}));

describe('parseAddressJson', () => {
  it('returns null for falsy values', () => {
    expect(parseAddressJson(undefined)).toBeNull();
    expect(parseAddressJson(null)).toBeNull();
    expect(parseAddressJson('')).toBeNull();
    expect(parseAddressJson(0)).toBeNull();
    expect(parseAddressJson(false)).toBeNull();
  });

  it('returns the object if value is already a non-array object', () => {
    const obj = {
      address: '123 Đường Lê Lợi, Quận 1',
      city: 'Hồ Chí Minh',
      phone: '0901234567',
    };
    expect(parseAddressJson(obj)).toEqual(obj);
    expect(parseAddressJson({})).toEqual({});
  });

  it('returns null if value is an array object', () => {
    expect(parseAddressJson(['123 Đường Lê Lợi'])).toBeNull();
    expect(parseAddressJson([])).toBeNull();
  });

  it('returns null for non-string truthy primitive values', () => {
    expect(parseAddressJson(123)).toBeNull();
    expect(parseAddressJson(true)).toBeNull();
    expect(parseAddressJson(Symbol('addr'))).toBeNull();
  });

  it('returns null for empty or whitespace-only strings', () => {
    expect(parseAddressJson('   ')).toBeNull();
    expect(parseAddressJson('\t\n  ')).toBeNull();
  });

  it('parses valid JSON string representing an object', () => {
    const raw = JSON.stringify({
      address: '456 Phố Huế',
      district: 'Hai Bà Trưng',
      city: 'Hà Nội',
    });
    expect(parseAddressJson(raw)).toEqual({
      address: '456 Phố Huế',
      district: 'Hai Bà Trưng',
      city: 'Hà Nội',
    });
  });

  it('returns null if JSON string parses to an array or primitive or null', () => {
    expect(parseAddressJson('[1, 2, 3]')).toBeNull();
    expect(parseAddressJson('null')).toBeNull();
    expect(parseAddressJson('42')).toBeNull();
    expect(parseAddressJson('"just a string"')).toBeNull();
    expect(parseAddressJson('true')).toBeNull();
  });

  it('returns null when JSON parsing throws a syntax error', () => {
    expect(parseAddressJson('{ invalid json format')).toBeNull();
    expect(parseAddressJson('undefined')).toBeNull();
  });
});

describe('ordersApi', () => {
  const mockedApiClient = vi.mocked(apiClient);

  const baseRawOrder = {
    id: 'ord-001',
    code: 'ORD-2026-001',
    orderNumber: 'LEGACY-001',
    status: 'PENDING_PAYMENT',
    total: 580000,
    shippingFee: 30000,
    paymentMethod: 'COD',
    createdAt: '2026-03-01T10:00:00.000Z',
    items: [
      {
        id: 'item-1',
        unitPrice: 550000,
        quantity: 1,
        nameSnapshot: 'Nước hoa Charme Good Girl 100ml',
        variant: {
          id: 'var-1',
          product: {
            id: 'prod-1',
            name: 'Charme Good Girl',
            images: ['https://example.com/good-girl.jpg'],
          },
        },
      },
    ],
    addressJson: JSON.stringify({
      fullName: 'Nguyễn Văn A',
      phone: '0987654321',
      address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1',
      city: 'Hồ Chí Minh',
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches orders with default pagination (page=1, limit=10) and unwraps response.data.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [baseRawOrder],
            total: 1,
            totalPages: 1,
          },
        },
      });

      const result = await ordersApi.getAll();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders/my', {
        params: { page: 1, limit: 10 },
      });
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.orders).toHaveLength(1);

      const order = result.orders[0];
      expect(order.id).toBe('ord-001');
      expect(order.orderNumber).toBe('ORD-2026-001');
      expect(order.status).toBe('PENDING_PAYMENT');
      expect(order.total).toBe(580000);
      expect(order.shippingFee).toBe(30000);
      expect(order.paymentMethod).toBe('COD');
      expect(order.shippingAddress).toEqual({
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1',
        city: 'Hồ Chí Minh',
      });
      expect(order.items[0]).toMatchObject({
        name: 'Nước hoa Charme Good Girl 100ml',
        price: 550000,
        quantity: 1,
        image: 'https://example.com/good-girl.jpg',
        productName: 'Charme Good Girl',
      });
    });

    it('fetches orders with custom page and limit', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 0,
            totalPages: 0,
          },
        },
      });

      const result = await ordersApi.getAll(3, 20);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders/my', {
        params: { page: 3, limit: 20 },
      });
      expect(result.orders).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('unwraps flat response.data when response.data.data is undefined', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          total: 10,
          totalPages: 1,
        },
      });

      const result = await ordersApi.getAll();

      expect(result.orders).toEqual([]);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('calculates totalPages using Math.ceil when totalPages is not returned by the API', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [baseRawOrder],
            total: 25,
          },
        },
      });

      const result = await ordersApi.getAll(1, 10);

      // Math.ceil(25 / 10) = 3
      expect(result.totalPages).toBe(3);
      expect(result.total).toBe(25);
    });

    it('falls back to empty array and 0 total when data fields are omitted in API response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {},
        },
      });

      const result = await ordersApi.getAll(1, 10);

      expect(result.orders).toEqual([]);
      expect(result.total).toBe(0);
      // Math.ceil(0 / 10) = 0
      expect(result.totalPages).toBe(0);
    });

    it('propagates error when apiClient.get fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      await expect(ordersApi.getAll()).rejects.toThrow('Network Error');
    });
  });

  describe('orderSchema transformations', () => {
    it('uses orderNumber fallback when code is undefined or empty', async () => {
      const rawWithoutCode = {
        ...baseRawOrder,
        id: 'ord-fallback-code',
        code: undefined,
        orderNumber: 'LEGACY-NUM-999',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawWithoutCode },
      });

      const order = await ordersApi.getById('ord-fallback-code');
      expect(order.orderNumber).toBe('LEGACY-NUM-999');
    });

    it('uses line1 as address when address field is missing in addressJson', async () => {
      const rawWithLine1 = {
        ...baseRawOrder,
        id: 'ord-line1',
        addressJson: JSON.stringify({
          fullName: 'Trần Thị B',
          line1: '456 Đường Nguyễn Thị Minh Khai',
          city: 'Đà Nẵng',
        }),
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawWithLine1 },
      });

      const order = await ordersApi.getById('ord-line1');
      expect(order.shippingAddress).toEqual({
        fullName: 'Trần Thị B',
        line1: '456 Đường Nguyễn Thị Minh Khai',
        address: '456 Đường Nguyễn Thị Minh Khai',
        city: 'Đà Nẵng',
      });
    });

    it('falls back to parsing shippingAddress when addressJson is not provided', async () => {
      const rawWithShippingAddressObj = {
        ...baseRawOrder,
        id: 'ord-shipping-obj',
        addressJson: undefined,
        shippingAddress: {
          fullName: 'Lê Văn C',
          address: '789 Phố Bà Triệu',
          city: 'Hà Nội',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawWithShippingAddressObj },
      });

      const order = await ordersApi.getById('ord-shipping-obj');
      expect(order.shippingAddress).toEqual({
        fullName: 'Lê Văn C',
        address: '789 Phố Bà Triệu',
        city: 'Hà Nội',
      });
    });

    it('returns null for shippingAddress when both addressJson and shippingAddress are missing', async () => {
      const rawNoAddress = {
        ...baseRawOrder,
        id: 'ord-no-addr',
        addressJson: undefined,
        shippingAddress: undefined,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawNoAddress },
      });

      const order = await ordersApi.getById('ord-no-addr');
      expect(order.shippingAddress).toBeNull();
    });

    it('returns null for shippingAddress when addressJson contains invalid JSON string', async () => {
      const rawInvalidAddressJson = {
        ...baseRawOrder,
        id: 'ord-invalid-json',
        addressJson: '{ not a valid json }',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawInvalidAddressJson },
      });

      const order = await ordersApi.getById('ord-invalid-json');
      expect(order.shippingAddress).toBeNull();
    });

    it('handles item mapping when variant is undefined or lacks product info', async () => {
      const rawItemWithoutVariant = {
        ...baseRawOrder,
        id: 'ord-no-variant',
        items: [
          {
            id: 'item-no-var',
            unitPrice: 200000,
            quantity: 3,
            nameSnapshot: 'Nước hoa Charme Mini',
            variant: undefined,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawItemWithoutVariant },
      });

      const order = await ordersApi.getById('ord-no-variant');
      expect(order.items[0]).toMatchObject({
        name: 'Nước hoa Charme Mini',
        price: 200000,
        quantity: 3,
        image: null,
        productName: 'Nước hoa Charme Mini',
      });
    });

    it('handles item mapping when product images array is empty or undefined', async () => {
      const rawEmptyImages = {
        ...baseRawOrder,
        id: 'ord-empty-images',
        items: [
          {
            id: 'item-empty-img',
            unitPrice: 350000,
            quantity: 2,
            nameSnapshot: 'Nước hoa Charme King',
            variant: {
              product: {
                name: 'Charme King 60ml',
                images: [],
              },
            },
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawEmptyImages },
      });

      const order = await ordersApi.getById('ord-empty-images');
      expect(order.items[0].image).toBeNull();
      expect(order.items[0].productName).toBe('Charme King 60ml');
    });

    it('falls back to nameSnapshot when variant.product.name is missing', async () => {
      const rawNoProductName = {
        ...baseRawOrder,
        id: 'ord-no-prod-name',
        items: [
          {
            id: 'item-no-name',
            unitPrice: 400000,
            quantity: 1,
            nameSnapshot: 'Tên từ Snapshot',
            variant: {
              product: {
                images: ['https://example.com/img.jpg'],
              },
            },
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: rawNoProductName },
      });

      const order = await ordersApi.getById('ord-no-prod-name');
      expect(order.items[0].productName).toBe('Tên từ Snapshot');
      expect(order.items[0].image).toBe('https://example.com/img.jpg');
    });
  });

  describe('getById', () => {
    it('fetches order by id with nested response.data.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: baseRawOrder,
        },
      });

      const result = await ordersApi.getById('ord-001');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders/my/ord-001');
      expect(result.id).toBe('ord-001');
      expect(result.orderNumber).toBe('ORD-2026-001');
    });

    it('fetches order by id with flat response.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: baseRawOrder,
      });

      const result = await ordersApi.getById('ord-001');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders/my/ord-001');
      expect(result.id).toBe('ord-001');
    });

    it('propagates error when apiClient.get fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Order not found'),
      );

      await expect(ordersApi.getById('ord-999')).rejects.toThrow(
        'Order not found',
      );
    });

    it('throws zod validation error if response format is invalid', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            id: 12345, // invalid type: number instead of string
          },
        },
      });

      await expect(ordersApi.getById('ord-invalid')).rejects.toThrow();
    });
  });

  describe('cancel', () => {
    it('cancels order by id and unwraps response.data.data', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          data: {
            id: 'ord-001',
            status: 'CANCELED',
            message: 'Hủy đơn hàng thành công',
          },
        },
      });

      const result = await ordersApi.cancel('ord-001');

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/orders/my/ord-001/cancel',
      );
      expect(result).toEqual({
        id: 'ord-001',
        status: 'CANCELED',
        message: 'Hủy đơn hàng thành công',
      });
    });

    it('cancels order by id and returns flat response.data when response.data.data is missing', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          id: 'ord-002',
          status: 'CANCELED',
        },
      });

      const result = await ordersApi.cancel('ord-002');

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/orders/my/ord-002/cancel',
      );
      expect(result).toEqual({
        id: 'ord-002',
        status: 'CANCELED',
      });
    });

    it('propagates error when apiClient.patch fails', async () => {
      vi.mocked(apiClient.patch).mockRejectedValueOnce(
        new Error('Cannot cancel order'),
      );

      await expect(ordersApi.cancel('ord-001')).rejects.toThrow(
        'Cannot cancel order',
      );
    });
  });
});
