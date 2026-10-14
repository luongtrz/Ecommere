import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    mutationFn: (data: Partial<ReferralConfig>) => adminReferralsApi.updateConfig(data),
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
      referrerCouponType: configForm.referrerCouponType ?? config?.referrerCouponType,
      referrerCouponValue: configForm.referrerCouponValue ?? config?.referrerCouponValue,
      referrerMaxDiscount: configForm.referrerMaxDiscount ?? config?.referrerMaxDiscount,
      refereeCouponType: configForm.refereeCouponType ?? config?.refereeCouponType,
      refereeCouponValue: configForm.refereeCouponValue ?? config?.refereeCouponValue,
      refereeMaxDiscount: configForm.refereeMaxDiscount ?? config?.refereeMaxDiscount,
      minOrderForCoupon: configForm.minOrderForCoupon ?? config?.minOrderForCoupon,
      couponValidDays: configForm.couponValidDays ?? config?.couponValidDays,
      maxReferralsPerUser: configForm.maxReferralsPerUser ?? config?.maxReferralsPerUser,
    };
    updateConfigMutation.mutate(data);
  };

  const getFieldValue = (field: keyof ReferralConfig) => {
    return configForm[field] !== undefined ? configForm[field] : config?.[field];
  };

  const renderTypeBadge = (type: 'PERCENT' | 'FIXED' | 'FREESHIP', value?: number) => {
    switch (type) {
      case 'PERCENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-500/15 text-amber-300 border-amber-500/25">
            <Percent className="h-3 w-3" />
            Phần trăm{value !== undefined ? ` (${value}%)` : ''}
          </span>
        );
      case 'FIXED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-500/15 text-slate-300 border-slate-500/25">
            <Ticket className="h-3 w-3" />
            Cố định{value !== undefined ? ` (${formatCurrency(value)})` : ''}
          </span>
        );
      case 'FREESHIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-300 border-emerald-500/25">
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
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Quản lý mã giảm giá và Referral
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Thiết lập mã khuyến mãi, chiết khấu và chương trình giới thiệu khách hàng.
            </p>
          </div>
        </div>

        <Tabs defaultValue="coupons" className="space-y-6">
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="inline-flex w-full md:w-auto grid-cols-3 max-w-lg bg-card border border-border p-1 text-muted-foreground">
              <TabsTrigger
                value="coupons"
                className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-semibold transition-all"
              >
                Mã giảm giá
              </TabsTrigger>
              <TabsTrigger
                value="referral-config"
                className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-semibold transition-all"
              >
                Cấu hình Referral
              </TabsTrigger>
              <TabsTrigger
                value="referral-list"
                className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-semibold transition-all"
              >
                Danh sách Referral
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Coupon Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Danh sách mã giảm giá</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Các mã giảm giá đang áp dụng trên toàn hệ thống cửa hàng.
                </p>
              </div>
              <Button className="gap-2 self-start sm:self-auto">
                <Plus className="mr-2 h-4 w-4" />
                Thêm mã
              </Button>
            </div>

            {/* Quick Stats for Coupons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    Tổng mã giảm giá
                  </CardDescription>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-bold tabular-nums text-foreground">{totalCouponsCount}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Đã khởi tạo trong kho ưu đãi</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:border-emerald-500/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    Đang kích hoạt
                  </CardDescription>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-emerald-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-bold tabular-nums text-emerald-300">{activeCouponsCount}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Sẵn sàng để khách hàng áp dụng</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:border-amber-500/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    Tổng lượt đã áp dụng
                  </CardDescription>
                  <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-amber-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-bold tabular-nums text-amber-300">{totalUsesCount}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Lượt dùng coupon thành công</p>
                </CardContent>
              </Card>
            </div>

            {/* Coupons Table */}
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {coupons.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    Danh sách mã giảm giá sẽ hiển thị tại đây
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Mã giảm giá</th>
                          <th className="px-4 py-3">Loại ưu đãi</th>
                          <th className="px-4 py-3">Đơn tối thiểu</th>
                          <th className="px-4 py-3">Tiến độ sử dụng</th>
                          <th className="px-4 py-3">Hạn dùng</th>
                          <th className="px-4 py-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {coupons.map((coupon) => {
                          const usagePercent = coupon.maxUses > 0 ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : 0;
                          return (
                            <tr key={coupon.id} className="hover:bg-muted/40 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-mono text-sm font-bold text-foreground tracking-wider">
                                    {coupon.code}
                                  </span>
                                  {coupon.maxDiscount && (
                                    <span className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                                      Tối đa: {formatCurrency(coupon.maxDiscount)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {renderTypeBadge(coupon.type, coupon.value)}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                {coupon.minOrder > 0 ? formatCurrency(coupon.minOrder) : 'Không giới hạn'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="w-48 space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span className="tabular-nums">
                                      <strong className="text-foreground">{coupon.usedCount}</strong> / {coupon.maxUses}
                                    </span>
                                    <span className="tabular-nums font-medium text-foreground">{usagePercent}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all duration-300"
                                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                                {new Date(coupon.validUntil).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2 justify-end">
                                  <span className={cn('text-xs font-medium', coupon.active ? 'text-emerald-300' : 'text-muted-foreground')}>
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
                  <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-card border-border shadow-sm hover:border-primary/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.totalReferrals || 0}</p>
                          <p className="text-xs text-muted-foreground">Tổng lượt giới thiệu</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border shadow-sm hover:border-emerald-500/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-emerald-300" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-emerald-300">{stats?.totalCouponsCreated || 0}</p>
                          <p className="text-xs text-muted-foreground">Coupon đã tạo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border shadow-sm hover:border-amber-500/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-amber-300" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-300">
                            {(getFieldValue('active') as boolean) ? 'Bật' : 'Tắt'}
                          </p>
                          <p className="text-xs text-muted-foreground">Trạng thái</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Config form */}
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="border-b border-border bg-muted/20 py-4 px-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground">
                      <Settings className="h-5 w-5 text-primary" />
                      Cấu hình chương trình giới thiệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Active toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                      <div>
                        <Label className="text-sm font-medium text-foreground">Kích hoạt tính năng Referral</Label>
                        <p className="text-xs text-muted-foreground mt-1">
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
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Người giới thiệu (Referrer)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">Loại coupon</Label>
                          <Select
                            value={(getFieldValue('referrerCouponType') as string) || 'PERCENT'}
                            onValueChange={(v) => setConfigForm((prev) => ({ ...prev, referrerCouponType: v as any }))}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                              <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Giá trị</Label>
                          <Input
                            type="number"
                            className="bg-background border-border text-foreground tabular-nums"
                            value={(getFieldValue('referrerCouponValue') as number) || 0}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, referrerCouponValue: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Giảm tối đa (VND)</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
                            className="bg-background border-border text-foreground tabular-nums placeholder:text-muted-foreground"
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
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Người được giới thiệu (Referee)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">Loại coupon</Label>
                          <Select
                            value={(getFieldValue('refereeCouponType') as string) || 'PERCENT'}
                            onValueChange={(v) => setConfigForm((prev) => ({ ...prev, refereeCouponType: v as any }))}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                              <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Giá trị</Label>
                          <Input
                            type="number"
                            className="bg-background border-border text-foreground tabular-nums"
                            value={(getFieldValue('refereeCouponValue') as number) || 0}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, refereeCouponValue: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Giảm tối đa (VND)</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
                            className="bg-background border-border text-foreground tabular-nums placeholder:text-muted-foreground"
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
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Cấu hình chung
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">Đơn hàng tối thiểu (VND)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            className="bg-background border-border text-foreground tabular-nums placeholder:text-muted-foreground"
                            value={(getFieldValue('minOrderForCoupon') as number) || ''}
                            onChange={(e) => setConfigForm((prev) => ({
                              ...prev,
                              minOrderForCoupon: e.target.value ? Number(e.target.value) : null,
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Số ngày hiệu lực coupon</Label>
                          <Input
                            type="number"
                            className="bg-background border-border text-foreground tabular-nums"
                            value={(getFieldValue('couponValidDays') as number) || 30}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, couponValidDays: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Giới hạn lượt mời/user</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
                            className="bg-background border-border text-foreground tabular-nums placeholder:text-muted-foreground"
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
                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button
                        onClick={handleSaveConfig}
                        disabled={updateConfigMutation.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateConfigMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Top referrers */}
                {stats?.topReferrers && stats.topReferrers.length > 0 && (
                  <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="border-b border-border bg-muted/20 py-4 px-6">
                      <CardTitle className="text-base md:text-lg font-semibold text-foreground">Top người giới thiệu</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-2.5">
                        {stats.topReferrers.map((item, index) => (
                          <div
                            key={item.user?.id || index}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold tabular-nums">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.user?.name || item.user?.email}</p>
                                <p className="text-xs text-muted-foreground">{item.user?.email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="border-border tabular-nums">{item.referralCount} lượt</Badge>
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
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/20 py-4 px-6">
                <CardTitle className="text-base md:text-lg font-semibold text-foreground">Danh sách giới thiệu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {listLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !referralList || referralList.data.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    Chưa có lượt giới thiệu nào
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Người giới thiệu</th>
                          <th className="px-4 py-3">Người được mời</th>
                          <th className="px-4 py-3">Coupon Referrer</th>
                          <th className="px-4 py-3">Coupon Referee</th>
                          <th className="px-4 py-3 text-right">Ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {referralList.data.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{item.referrer.name || item.referrer.email}</p>
                                <p className="text-xs text-muted-foreground font-mono">{item.referrer.referralCode}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{item.referee.name || item.referee.email}</p>
                                <p className="text-xs text-muted-foreground">{item.referee.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {item.referrerCouponCode ? (
                                <Badge variant="outline" className="font-mono text-xs border-border text-foreground">
                                  {item.referrerCouponCode}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.refereeCouponCode ? (
                                <Badge variant="outline" className="font-mono text-xs border-border text-foreground">
                                  {item.refereeCouponCode}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs text-right">
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
