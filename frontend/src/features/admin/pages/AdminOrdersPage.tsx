import { SEO } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/card';

export function AdminOrdersPage() {
  return (
    <>
      <SEO title="Quản lý đơn hàng - Admin" />
      <div>
        <h1 className="text-3xl font-bold mb-8">Quản lý đơn hàng</h1>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center py-12">
              Danh sách đơn hàng sẽ hiển thị tại đây
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
