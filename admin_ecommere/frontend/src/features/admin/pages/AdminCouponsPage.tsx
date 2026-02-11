import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Users, BarChart3, Save } from 'lucide-react';
import { adminReferralsApi, type ReferralConfig } from '../api/adminReferrals.api';
import { useToast } from '@/hooks/useToast';

export function AdminCouponsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [configForm, setConfigForm] = useState<Partial<ReferralConfig>>({});

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

  return (
    <>
      <SEO title="Quản lý mã giảm giá và Referral - Admin" />
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Quản lý mã giảm giá và Referral</h1>
        </div>

        <Tabs defaultValue="coupons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="coupons">Mã giảm giá</TabsTrigger>
            <TabsTrigger value="referral-config">Cấu hình Referral</TabsTrigger>
            <TabsTrigger value="referral-list">Danh sách Referral</TabsTrigger>
          </TabsList>

          {/* Coupon Tab - existing placeholder */}
          <TabsContent value="coupons">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Danh sách mã giảm giá</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm mã
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center py-12">
                  Danh sách mã giảm giá sẽ hiển thị tại đây
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Config Tab */}
          <TabsContent value="referral-config">
            {configLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                          <p className="text-xs text-muted-foreground">Tổng lượt giới thiệu</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalCouponsCreated || 0}</p>
                          <p className="text-xs text-muted-foreground">Coupon đã tạo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {(getFieldValue('active') as boolean) ? 'Bật' : 'Tắt'}
                          </p>
                          <p className="text-xs text-muted-foreground">Trạng thái</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Config form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Cấu hình chương trình giới thiệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Active toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <Label className="text-sm font-medium">Kích hoạt tính năng Referral</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Bật/tắt chương trình giới thiệu bạn bè
                        </p>
                      </div>
                      <Switch
                        checked={getFieldValue('active') as boolean || false}
                        onCheckedChange={(checked) => setConfigForm((prev) => ({ ...prev, active: checked }))}
                      />
                    </div>

                    {/* Referrer config */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Người giới thiệu (Referrer)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Loại coupon</Label>
                          <Select
                            value={(getFieldValue('referrerCouponType') as string) || 'PERCENT'}
                            onValueChange={(v) => setConfigForm((prev) => ({ ...prev, referrerCouponType: v as any }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                              <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Giá trị</Label>
                          <Input
                            type="number"
                            value={(getFieldValue('referrerCouponValue') as number) || 0}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, referrerCouponValue: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Giảm tối đa (VND)</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
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
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Người được giới thiệu (Referee)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Loại coupon</Label>
                          <Select
                            value={(getFieldValue('refereeCouponType') as string) || 'PERCENT'}
                            onValueChange={(v) => setConfigForm((prev) => ({ ...prev, refereeCouponType: v as any }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                              <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                              <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Giá trị</Label>
                          <Input
                            type="number"
                            value={(getFieldValue('refereeCouponValue') as number) || 0}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, refereeCouponValue: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Giảm tối đa (VND)</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
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
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Cấu hình chung
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Đơn hàng tối thiểu (VND)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={(getFieldValue('minOrderForCoupon') as number) || ''}
                            onChange={(e) => setConfigForm((prev) => ({
                              ...prev,
                              minOrderForCoupon: e.target.value ? Number(e.target.value) : null,
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Số ngày hiệu lực coupon</Label>
                          <Input
                            type="number"
                            value={(getFieldValue('couponValidDays') as number) || 30}
                            onChange={(e) => setConfigForm((prev) => ({ ...prev, couponValidDays: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Giới hạn lượt mời/user</Label>
                          <Input
                            type="number"
                            placeholder="Không giới hạn"
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
                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={handleSaveConfig}
                        disabled={updateConfigMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateConfigMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Top referrers */}
                {stats?.topReferrers && stats.topReferrers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top người giới thiệu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.topReferrers.map((item, index) => (
                          <div key={item.user?.id || index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium">{item.user?.name || item.user?.email}</p>
                                <p className="text-xs text-muted-foreground">{item.user?.email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{item.referralCount} lượt</Badge>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Danh sách giới thiệu</CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                ) : !referralList || referralList.data.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    Chưa có lượt giới thiệu nào
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-3 font-medium text-muted-foreground">Người giới thiệu</th>
                          <th className="p-3 font-medium text-muted-foreground">Người được mời</th>
                          <th className="p-3 font-medium text-muted-foreground">Coupon Referrer</th>
                          <th className="p-3 font-medium text-muted-foreground">Coupon Referee</th>
                          <th className="p-3 font-medium text-muted-foreground">Ngày</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralList.data.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{item.referrer.name || item.referrer.email}</p>
                                <p className="text-xs text-muted-foreground">{item.referrer.referralCode}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{item.referee.name || item.referee.email}</p>
                                <p className="text-xs text-muted-foreground">{item.referee.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              {item.referrerCouponCode ? (
                                <Badge variant="outline" className="font-mono text-xs">{item.referrerCouponCode}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              {item.refereeCouponCode ? (
                                <Badge variant="outline" className="font-mono text-xs">{item.refereeCouponCode}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-muted-foreground">
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
