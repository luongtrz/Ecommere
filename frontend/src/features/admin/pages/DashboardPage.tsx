import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';

export function DashboardPage() {
  const stats = [
    {
      title: 'Doanh thu tháng',
      value: '125,000,000đ',
      icon: DollarSign,
      change: '+12.5%',
    },
    {
      title: 'Đơn hàng',
      value: '248',
      icon: ShoppingCart,
      change: '+8.2%',
    },
    {
      title: 'Sản phẩm',
      value: '156',
      icon: Package,
      change: '+3 mới',
    },
    {
      title: 'Khách hàng',
      value: '1,245',
      icon: Users,
      change: '+45 mới',
    },
  ];

  return (
    <>
      <SEO title="Dashboard - Admin" />
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
