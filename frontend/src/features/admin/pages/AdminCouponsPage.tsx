import { SEO } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function AdminCouponsPage() {
  return (
    <>
      <SEO title="Quản lý mã giảm giá - Admin" />
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Quản lý mã giảm giá</h1>
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
      </div>
    </>
  );
}
