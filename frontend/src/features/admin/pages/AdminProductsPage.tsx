import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export function AdminProductsPage() {
  return (
    <>
      <SEO title="Quản lý sản phẩm - Admin" />
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center py-12">
              Danh sách sản phẩm sẽ hiển thị tại đây
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
