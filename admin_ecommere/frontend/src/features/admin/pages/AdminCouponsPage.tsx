import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Users, BarChart3, Save, Ticket, Percent, Truck } from 'lucide-react';
import { adminReferralsApi, type ReferralConfig } from '../api/adminReferrals.api';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';

interface CouponItem {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED' | 'FREESHIP';
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usedCount: number;
  maxUses: number;
  active: boolean;
  validUntil: string;
}

export function AdminCouponsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [configForm, setConfigForm] = useState<Partial<ReferralConfig>>({});

  const [coupons, setCoupons] = useState<CouponItem[]>([
    {
      id: 'cp-1',
      code: 'CHAOBANMOI',
      type: 'PERCENT',
      value: 15,
      minOrder: 200000,
      maxDiscount: 50000,
      usedCount: 68,
      maxUses: 100,
      active: true,
      validUntil: '2026-12-31',
    },
    {
      id: 'cp-2',
      code: 'FREESHIPMAX',
      type: 'FREESHIP',
      value: 30000,
      minOrder: 300000,
      maxDiscount: 30000,
      usedCount: 142,
      maxUses: 200,
      active: true,
      validUntil: '2026-11-30',
    },
    {
      id: 'cp-3',
      code: 'GIAM50K',
      type: 'FIXED',
      value: 50000,
      minOrder: 500000,
      maxDiscount: 50000,
      usedCount: 29,
      maxUses: 50,
      active: false,
      validUntil: '2026-10-31',
    },
    {
      id: 'cp-4',
      code: 'LUXURYVIP',
      type: 'PERCENT',
      value: 25,
      minOrder: 1000000,
      maxDiscount: 300000,
      usedCount: 12,
      maxUses: 30,
      active: true,
      validUntil: '2027-01-15',
    },
  ]);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['admin-referral-config'],
    queryFn: () => adminReferralsApi.getConfig(),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-referral-stats'],
    queryFn: () => adminReferralsApi.getStats(),
  });

  const { data: referralList, isLoading: listLoading } = useQuery({
    queryKey: ['admin-referral-list'],
    queryFn: () => adminReferralsApi.getReferrals(1, 50),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<ReferralConfig>) =>
      adminReferralsApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-stats'] });
      toast.success('Cập nhật cấu hình referral thành công!');
    },
    onError: () => {
      toast.error('Không thể cập nhật cấu hình. Vui lòng thử lại.');
    },
  });

  const handleSaveConfig = () => {
    const data = {
      active: configForm.active ?? config?.active,
      referrerCouponType:
        configForm.referrerCouponType ?? config?.referrerCouponType,
      referrerCouponValue:
        configForm.referrerCouponValue ?? config?.referrerCouponValue,
      referrerMaxDiscount:
        configForm.referrerMaxDiscount ?? config?.referrerMaxDiscount,
      refereeCouponType:
        configForm.refereeCouponType ?? config?.refereeCouponType,
      refereeCouponValue:
        configForm.refereeCouponValue ?? config?.refereeCouponValue,
      refereeMaxDiscount:
        configForm.refereeMaxDiscount ?? config?.refereeMaxDiscount,
      minOrderForCoupon:
        configForm.minOrderForCoupon ?? config?.minOrderForCoupon,
      couponValidDays: configForm.couponValidDays ?? config?.couponValidDays,
      maxReferralsPerUser:
        configForm.maxReferralsPerUser ?? config?.maxReferralsPerUser,
    };
    updateConfigMutation.mutate(data);
  };

  const getFieldValue = (field: keyof ReferralConfig) => {
    return configForm[field] !== undefined
      ? configForm[field]
      : config?.[field];
  };

  const renderTypeBadge = (type: 'PERCENT' | 'FIXED' | 'FREESHIP', value?: number) => {
    switch (type) {
      case 'PERCENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200">
            <Percent className="h-3 w-3" />
            Phần trăm{value !== undefined ? ` (${value}%)` : ''}
          </span>
        );
      case 'FIXED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <Ticket className="h-3 w-3" />
            Cố định{value !== undefined ? ` (${formatCurrency(value)})` : ''}
          </span>
        );
      case 'FREESHIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <Truck className="h-3 w-3" />
            Miễn phí vận chuyển
          </span>
        );
    }
  };

  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter((c) => c.active).length;
  const totalUsesCount = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <>
      <SEO title="Quản lý mã giảm giá và Referral - Admin" />
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Quản lý mã giảm giá và Referral
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Thiết lập mã khuyến mãi, chiết khấu và chương trình giới thiệu khách hàng.
            </p>
          </div>
        </div>

        <Tabs defaultValue="coupons" className="space-y-6">
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="inline-flex w-full md:w-auto h-auto p-1 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 gap-1">
              <TabsTrigger
                value="coupons"
                className="text-xs px-3.5 py-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:font-semibold text-slate-600 hover:text-slate-900 transition-all"
              >
                Mã giảm giá
              </TabsTrigger>
              <TabsTrigger
                value="referral-config"
                className="text-xs px-3.5 py-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:font-semibold text-slate-600 hover:text-slate-900 transition-all"
              >
                Cấu hình Referral
              </TabsTrigger>
              <TabsTrigger
                value="referral-list"
                className="text-xs px-3.5 py-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:font-semibold text-slate-600 hover:text-slate-900 transition-all"
              >
                Danh sách Referral
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Coupon Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">Danh sách mã giảm giá</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các mã giảm giá đang áp dụng trên toàn hệ thống cửa hàng.
                </p>
              </div>
              <Button className="gap-2 self-start sm:self-auto rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Thêm mã
              </Button>
            </div>

            {/* Quick Stats for Coupons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500">
                    Tổng mã giảm giá
                  </CardDescription>
                  <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <Ticket className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">{totalCouponsCount}</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Đã khởi tạo trong kho ưu đãi</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500">
                    Đang kích hoạt
                  </CardDescription>
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Percent className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-bold tabular-nums text-emerald-700">{activeCouponsCount}</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Sẵn sàng để khách hàng áp dụng</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500">
                    Tổng lượt đã áp dụng
                  </CardDescription>
                  <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-bold tabular-nums text-amber-700">{totalUsesCount}</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Lượt dùng coupon thành công</p>
                </CardContent>
              </Card>
            </div>

            {/* Coupons Table */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-0">
                {coupons.length === 0 ? (
                  <p className="text-slate-400 text-center py-12">
                    Danh sách mã giảm giá sẽ hiển thị tại đây
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Mã giảm giá</th>
                          <th className="px-4 py-3">Loại ưu đãi</th>
                          <th className="px-4 py-3">Đơn tối thiểu</th>
                          <th className="px-4 py-3">Tiến độ sử dụng</th>
                          <th className="px-4 py-3">Hạn dùng</th>
                          <th className="px-4 py-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coupons.map((coupon) => {
                          const usagePercent = coupon.maxUses > 0 ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : 0;
                          return (
                            <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                                    {coupon.code}
                                  </span>
                                  {coupon.maxDiscount && (
                                    <span className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                                      Tối đa: {formatCurrency(coupon.maxDiscount)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {renderTypeBadge(coupon.type, coupon.value)}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-600">
                                {coupon.minOrder > 0 ? formatCurrency(coupon.minOrder) : 'Không giới hạn'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="w-48 space-y-1">
                                  <div className="flex justify-between text-xs text-slate-500">
                                    <span className="tabular-nums">
                                      <strong className="text-slate-900">{coupon.usedCount}</strong> / {coupon.maxUses}
                                    </span>
                                    <span className="tabular-nums font-medium text-slate-900">{usagePercent}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-teal-600 transition-all duration-300"
                                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">
                                {new Date(coupon.validUntil).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2 justify-end">
                                  <span className={cn('text-xs font-medium', coupon.active ? 'text-emerald-700' : 'text-slate-400')}>
                                    {coupon.active ? 'Bật' : 'Tắt'}
                                  </span>
                                  <Switch
                                    checked={coupon.active}
                                    onCheckedChange={(checked) => {
                                      setCoupons((prev) =>
                                        prev.map((c) => (c.id === coupon.id ? { ...c, active: checked } : c))
                                      );
                                      toast.success(checked ? `Đã kích hoạt mã ${coupon.code}` : `Đã tắt mã ${coupon.code}`);
                                    }}
                                    aria-label={`Trạng thái mã ${coupon.code}`}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Config Tab */}
          <TabsContent value="referral-config" className="space-y-6">
            {configLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-slate-900">{stats?.totalReferrals || 0}</p>
                          <p className="text-xs text-slate-500">Tổng lượt giới thiệu</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-emerald-700">{stats?.totalCouponsCreated || 0}</p>
                          <p className="text-xs text-slate-500">Coupon đã tạo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-700">
                            {(getFieldValue('active') as boolean) ? 'Bật' : 'Tắt'}
                          </p>
                          <p className="text-xs text-slate-500">Trạng thái</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Config form */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardHeader className="border-b border-slate-200 bg-slate-50 py-4 px-6 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold text-slate-900">
                      <Settings className="h-5 w-5 text-teal-600" />
                      Cấu hình chương trình giới thiệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Active toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                      <div>
                        <Label className="text-sm font-medium text-slate-900">Kích hoạt tính năng Referral</Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Bật/tắt chương trình giới thiệu bạn bè
                        </p>
                      </div>
                      <Switch
                        checked={(getFieldValue('active') as boolean) || false}
                        onCheckedChange={(checked) => setConfigForm((prev) => ({ ...prev, active: checked }))}
                      />
                    </div>

                    {/* Referrer config */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Người giới thiệu (Referrer)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Loại coupon</Label>
                          <Select
                            value={
                              (getFieldValue('referrerCouponType') as string) ||
                              'PERCENT'
                            }
                            onValueChange={(v) =>
                              setConfigForm((prev) => ({
                                ...prev,
                                referrerCouponType: v as any,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-lg shadow-none text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                              <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Giá trị</Label>
                          <Input
                            type="number"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('referrerCouponValue') as number) || 0}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, referrerCouponValue: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Giảm tối đa (VND)</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('referrerMaxDiscount') as number) || ''}
                            onChange={(e) => setConfigForm((prev) => ({
                              ...prev,
                              referrerMaxDiscount: e.target.value ? Number(e.target.value) : null,
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Referee config */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Người được giới thiệu (Referee)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Loại coupon</Label>
                          <Select
                            value={
                              (getFieldValue('refereeCouponType') as string) ||
                              'PERCENT'
                            }
                            onValueChange={(v) =>
                              setConfigForm((prev) => ({
                                ...prev,
                                refereeCouponType: v as any,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-lg shadow-none text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                              <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Giá trị</Label>
                          <Input
                            type="number"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('refereeCouponValue') as number) || 0}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, refereeCouponValue: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Giảm tối đa (VND)</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('refereeMaxDiscount') as number) || ''}
                            onChange={(e) => setConfigForm((prev) => ({
                              ...prev,
                              refereeMaxDiscount: e.target.value ? Number(e.target.value) : null,
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* General config */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Cấu hình chung
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Đơn hàng tối thiểu (VND)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('minOrderForCoupon') as number) || ''}
                            onChange={(e) => setConfigForm((prev) => ({
                              ...prev,
                              minOrderForCoupon: e.target.value ? Number(e.target.value) : null,
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Số ngày hiệu lực coupon</Label>
                          <Input
                            type="number"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('couponValidDays') as number) || 30}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, couponValidDays: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-medium">Giới hạn lượt mời/user</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
                            className="bg-white border-slate-200 text-slate-900 tabular-nums placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-teal-500 rounded-lg text-sm"
                            value={(getFieldValue('maxReferralsPerUser') as number) || ''}
                            onChange={(e) => setConfigForm((prev) => ({
                              ...prev,
                              maxReferralsPerUser: e.target.value ? Number(e.target.value) : null,
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <Button
                        onClick={handleSaveConfig}
                        disabled={updateConfigMutation.isPending}
                        className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 font-medium shadow-sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateConfigMutation.isPending
                          ? 'Đang lưu...'
                          : 'Lưu cấu hình'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Top referrers */}
                {stats?.topReferrers && stats.topReferrers.length > 0 && (
                  <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 py-4 px-6 rounded-t-xl">
                      <CardTitle className="text-base md:text-lg font-semibold text-slate-900">Top người giới thiệu</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-2.5">
                        {stats.topReferrers.map((item, index) => (
                          <div
                            key={item.user?.id || index}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-xs font-bold tabular-nums">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{item.user?.name || item.user?.email}</p>
                                <p className="text-xs text-slate-500">{item.user?.email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="border-slate-200 bg-white text-slate-700 tabular-nums shadow-none">{item.referralCount} lượt</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Referral List Tab */}
          <TabsContent value="referral-list">
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 bg-slate-50 py-4 px-6">
                <CardTitle className="text-base md:text-lg font-semibold text-slate-900">Danh sách giới thiệu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {listLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !referralList || referralList.data.length === 0 ? (
                  <p className="text-slate-400 text-center py-12">
                    Chưa có lượt giới thiệu nào
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Người giới thiệu</th>
                          <th className="px-4 py-3">Người được mời</th>
                          <th className="px-4 py-3">Coupon Referrer</th>
                          <th className="px-4 py-3">Coupon Referee</th>
                          <th className="px-4 py-3 text-right">Ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {referralList.data.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900">{item.referrer.name || item.referrer.email}</p>
                                <p className="text-xs text-slate-500 font-mono">{item.referrer.referralCode}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900">{item.referee.name || item.referee.email}</p>
                                <p className="text-xs text-slate-500">{item.referee.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {item.referrerCouponCode ? (
                                <Badge variant="outline" className="font-mono text-xs border-slate-200 bg-slate-50 text-slate-700">
                                  {item.referrerCouponCode}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.refereeCouponCode ? (
                                <Badge variant="outline" className="font-mono text-xs border-slate-200 bg-slate-50 text-slate-700">
                                  {item.refereeCouponCode}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 tabular-nums text-xs text-right">
                              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
