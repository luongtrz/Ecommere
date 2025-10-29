import { SEO } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/card';

export function AdminInventoryPage() {
  return (
    <>
      <SEO title="Quản lý kho hàng - Admin" />
      <div>
        <h1 className="text-3xl font-bold mb-8">Quản lý kho hàng</h1>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center py-12">
              Danh sách kho hàng sẽ hiển thị tại đây
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
