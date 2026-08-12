import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Loader2, Save, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '../hooks/useAdminProducts';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useToast } from '@/hooks/useToast';

// Form validation schema
const variantFormSchema = z.object({
  scent: z.string().min(1, 'Mùi hương là bắt buộc'),
  volumeMl: z.number().int().min(1, 'Dung tích phải lớn hơn 0'),
  price: z.number().int().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  salePrice: z.number().int().min(0, 'Giá sale không được âm').nullable().optional(),
  stock: z.number().int().min(0, 'Tồn kho không được âm'),
  barcode: z.string().optional(),
}).refine((variant) => variant.salePrice == null || variant.salePrice <= variant.price, {
  path: ['salePrice'],
  message: 'Giá sale không được lớn hơn giá niêm yết',
});

const productFormSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  basePrice: z.number().min(0, 'Giá phải lớn hơn 0'),
  active: z.boolean(),
  variants: z.array(variantFormSchema).min(1, 'Sản phẩm phải có ít nhất một biến thể'),
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

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Form
  const {
    register,
    handleSubmit,
    control,
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
      active: true,
      variants: [
        {
          scent: '',
          volumeMl: 50,
          price: 0,
          salePrice: undefined,
          stock: 0,
          barcode: '',
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'variants',
  });

  // Fetch categories tree and flatten to leaves only
  const [categories, setCategories] = useState<any[]>([]); // Flattened for lookup
  const [categoryTree, setCategoryTree] = useState<any[]>([]); // Tree for dropdown

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const tree = await import('../api/categories.api').then(m => m.categoriesApi.getTree());

        // Flatten tree but only keep leaves
        const allCategories: any[] = [];
        const traverse = (nodes: any[], prefix = '') => {
          nodes.forEach(node => {
            const currentName = prefix + node.name;
            const isLeaf = !node.children || node.children.length === 0;

            allCategories.push({
              ...node,
              displayName: currentName,
              isLeaf,
            });

            if (node.children && node.children.length > 0) {
              traverse(node.children, currentName + ' > ');
            }
          });
        };
        traverse(tree);
        setCategories(allCategories);
        setCategoryTree(tree);
      } catch (error) {
        console.error('Failed to load categories tree', error);
      }
    };
    loadCategories();
  }, []);

  // Fill form when product data is loaded
  useEffect(() => {
    if (product && isEditMode) {
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('basePrice', product.basePrice);
      setValue('active', product.active);
      replace(
        product.variants.map((variant) => ({
          scent: variant.scent,
          volumeMl: variant.volumeMl,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          barcode: variant.barcode ?? '',
        })),
      );
      setImages(product.images || []); // Initialize images

      // Only set categoryId if categories are loaded
      if (categories.length > 0) {
        setValue('categoryId', product.categoryId);
      }
    }
  }, [product, isEditMode, replace, setValue, categories]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditMode && id) {
        const { variants: _variants, ...productData } = data;

        // Update existing product
        await updateProduct.mutateAsync({
          id,
          data: {
            ...productData,
            images,
          },
        });
        toast.success(`Sản phẩm "${data.name}" đã được cập nhật thành công!`);
      } else {
        // Create new product
        await createProduct.mutateAsync({
          ...data,
          images,
        });
        toast.success(`Sản phẩm "${data.name}" đã được tạo thành công!`);
      }
      navigate('/admin/products');
    } catch (error: any) {
      // Handle Axios error response
      const serverMessage = error.response?.data?.message;
      const errorMessage = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : serverMessage || error.message || 'Không thể lưu sản phẩm';

      toast.error(`Lỗi: ${errorMessage}`);
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
      <div className="w-full max-w-[98%] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">
              {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/products')}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu sản phẩm
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Top Section: Images & Main Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Images */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle>Hình ảnh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <ImageUpload images={images} onChange={setImages} maxImages={5} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Main Info */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle>Thông tin chung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        rows={6}
                        className="resize-none"
                        {...register('description')}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Section: Category & Price */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Phân loại & Giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">
                      Danh mục <span className="text-destructive">*</span>
                    </Label>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={
                            `w-full justify-between ${!watch('categoryId') && "text-muted-foreground"
                            }`
                          }
                        >
                          {watch('categoryId')
                            ? categories.find((c) => c.id === watch('categoryId'))?.displayName
                            : (categories.length > 0 ? "Chọn danh mục" : "Đang tải danh mục...")}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto" align="start">
                        {(() => {
                          const renderMenu = (nodes: any[]) => {
                            return nodes.map((node) => {
                              const isLeaf = !node.children || node.children.length === 0;

                              if (isLeaf) {
                                return (
                                  <DropdownMenuItem
                                    key={node.id}
                                    onClick={() => {
                                      setValue('categoryId', node.id, { shouldValidate: true });
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <span className={watch('categoryId') === node.id ? "font-bold text-primary" : ""}>
                                      {node.name}
                                    </span>
                                  </DropdownMenuItem>
                                );
                              }

                              return (
                                <DropdownMenuSub key={node.id}>
                                  <DropdownMenuSubTrigger className="cursor-pointer font-medium">
                                    <span>{node.name}</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                                    {renderMenu(node.children)}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              );
                            });
                          };
                          return renderMenu(categoryTree);
                        })()}
                      </DropdownMenuContent>
                    </DropdownMenu>

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
                      placeholder="0"
                      {...register('basePrice', { valueAsNumber: true })}
                    />
                    {errors.basePrice && (
                      <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="active">Hiển thị sản phẩm</Label>
                    <p className="text-sm text-muted-foreground">
                      Sản phẩm tắt sẽ không xuất hiện trong catalog công khai.
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={watch('active')}
                    onCheckedChange={(checked) => setValue('active', checked, { shouldDirty: true })}
                    aria-label="Hiển thị sản phẩm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Variants */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Biến thể sản phẩm</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEditMode
                      ? 'Các biến thể hiện có được hiển thị để đối chiếu.'
                      : 'Thêm ít nhất một mùi hương và dung tích trước khi lưu sản phẩm.'}
                  </p>
                </div>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({
                      scent: '',
                      volumeMl: 50,
                      price: 0,
                      salePrice: undefined,
                      stock: 0,
                      barcode: '',
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm biến thể
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium">Biến thể {index + 1}</p>
                      {!isEditMode && fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          aria-label={`Xóa biến thể ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`variants.${index}.scent`}>Mùi hương</Label>
                        <Input
                          id={`variants.${index}.scent`}
                          disabled={isEditMode}
                          {...register(`variants.${index}.scent`)}
                        />
                        {errors.variants?.[index]?.scent && (
                          <p className="text-sm text-destructive">{errors.variants[index]?.scent?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variants.${index}.volumeMl`}>Dung tích (ml)</Label>
                        <Input
                          id={`variants.${index}.volumeMl`}
                          type="number"
                          disabled={isEditMode}
                          {...register(`variants.${index}.volumeMl`, { valueAsNumber: true })}
                        />
                        {errors.variants?.[index]?.volumeMl && (
                          <p className="text-sm text-destructive">{errors.variants[index]?.volumeMl?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variants.${index}.stock`}>Tồn kho</Label>
                        <Input
                          id={`variants.${index}.stock`}
                          type="number"
                          disabled={isEditMode}
                          {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                        />
                        {errors.variants?.[index]?.stock && (
                          <p className="text-sm text-destructive">{errors.variants[index]?.stock?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variants.${index}.price`}>Giá niêm yết</Label>
                        <Input
                          id={`variants.${index}.price`}
                          type="number"
                          disabled={isEditMode}
                          {...register(`variants.${index}.price`, { valueAsNumber: true })}
                        />
                        {errors.variants?.[index]?.price && (
                          <p className="text-sm text-destructive">{errors.variants[index]?.price?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variants.${index}.salePrice`}>Giá sale</Label>
                        <Input
                          id={`variants.${index}.salePrice`}
                          type="number"
                          disabled={isEditMode}
                          {...register(`variants.${index}.salePrice`, {
                            setValueAs: (value) => value === '' ? undefined : Number(value),
                          })}
                        />
                        {errors.variants?.[index]?.salePrice && (
                          <p className="text-sm text-destructive">{errors.variants[index]?.salePrice?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variants.${index}.barcode`}>Barcode</Label>
                        <Input
                          id={`variants.${index}.barcode`}
                          disabled={isEditMode}
                          {...register(`variants.${index}.barcode`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {errors.variants?.root && (
                  <p className="text-sm text-destructive">{errors.variants.root.message}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </>
  );
}
