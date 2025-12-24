import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '../hooks/useAdminProducts';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useToast } from '@/hooks/useToast';

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  basePrice: z.number().min(0, 'Giá phải lớn hơn 0'),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;

  // Images state
  const [images, setImages] = useState<string[]>([]);

  // Fetch product data if editing
  const { data: product, isLoading: isLoadingProduct } = useAdminProduct(id || null);

  // Fetch categories for dropdown
  const { data: categories, isLoading: isLoadingCategories } = useCategories();

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      basePrice: 0,
    },
  });

  // Fill form when product data is loaded
  useEffect(() => {
    if (product && isEditMode) {
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('categoryId', product.categoryId);
      setValue('basePrice', product.basePrice);
      setImages(product.images || []); // Initialize images
    }
  }, [product, isEditMode, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditMode && id) {
        // Update existing product
        await updateProduct.mutateAsync({
          id,
          data: {
            ...data,
            images,
          },
        });
        toast.success(`✅ Sản phẩm "${data.name}" đã được cập nhật thành công!`);
      } else {
        // Create new product
        await createProduct.mutateAsync({
          ...data,
          images,
        });
        toast.success(`✅ Sản phẩm "${data.name}" đã được tạo thành công!`);
      }
      navigate('/admin/products');
    } catch (error: any) {
      toast.error(`❌ Lỗi: ${error?.message || 'Không thể lưu sản phẩm'}`);
    }
  };

  // Show loading spinner while fetching product data
  if (isEditMode && isLoadingProduct) {
    return (
      <>
        <SEO title="Đang tải..." />
        <div className="py-12">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  // Show error if product not found
  if (isEditMode && !isLoadingProduct && !product) {
    return (
      <>
        <SEO title="Không tìm thấy sản phẩm" />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
          <Button asChild>
            <Link to="/admin/products">Quay lại danh sách</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={isEditMode ? `Chỉnh sửa sản phẩm - ${product?.name || ''}` : 'Thêm sản phẩm mới'} />
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên sản phẩm <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nhập tên sản phẩm"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Mô tả <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả sản phẩm"
                  rows={5}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              {/* Product Images */}
              <div className="space-y-2">
                <Label>
                  Hình ảnh sản phẩm
                </Label>
                <ImageUpload images={images} onChange={setImages} maxImages={5} />
              </div>


              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId">
                    Danh mục <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('categoryId')}
                    onValueChange={(value) => setValue('categoryId', value)}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingCategories ? "Đang tải..." : "Chọn danh mục"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          Không có danh mục nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* Base Price */}
                <div className="space-y-2">
                  <Label htmlFor="basePrice">
                    Giá cơ bản <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="1000"
                    placeholder="0"
                    {...register('basePrice', { valueAsNumber: true })}
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/products')}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
