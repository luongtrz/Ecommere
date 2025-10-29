import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AdminProductFormPage() {
  return (
    <>
      <SEO title="Thêm sản phẩm - Admin" />
      <div>
        <h1 className="text-3xl font-bold mb-8">Thêm sản phẩm mới</h1>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input id="name" placeholder="Nhập tên sản phẩm" />
              </div>
              
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" placeholder="Nhập mô tả sản phẩm" rows={5} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Input id="category" placeholder="Chọn danh mục" />
                </div>
                <div>
                  <Label htmlFor="price">Giá</Label>
                  <Input id="price" type="number" placeholder="0" />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">Lưu sản phẩm</Button>
                <Button type="button" variant="outline">Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
