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
  basePrice: z.number().int('Giá phải là số nguyên').positive('Giá phải lớn hơn 0'),
  active: z.boolean(),
  variants: z.array(variantFormSchema).min(1, 'Sản phẩm phải có ít nhất một biến thể'),
  images: z.array(z.string()).min(1, 'Vui lòng thêm ít nhất 1 ảnh'),
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
      images: [],
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
      setValue('images', product.images || []);
    }
  }, [product, isEditMode, replace, setValue]);

  // Set categoryId when both product and categories are loaded
  useEffect(() => {
    if (product && isEditMode && categories.length > 0) {
      setValue('categoryId', product.categoryId);
    }
  }, [product, isEditMode, categories, setValue]);

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
        <div className="py-12 flex justify-center">
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
          <h1 className="text-2xl font-bold mb-4 text-slate-900">Không tìm thấy sản phẩm</h1>
          <Button asChild className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500">
            <Link to="/admin/products">Quay lại danh sách</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={isEditMode ? `Chỉnh sửa sản phẩm - ${product?.name || ''}` : 'Thêm sản phẩm mới'} />
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        {/* Dominant Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900">
              <Link to="/admin/products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditMode ? 'Cập nhật thông tin chi tiết, hình ảnh và biến thể sản phẩm' : 'Điền đầy đủ các thông tin để tạo sản phẩm mới vào danh mục'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/products')}
              disabled={isSubmitting}
              className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="min-w-[130px] rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 columns: Basic info + Variants */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Basic Info */}
              <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-900">
                      Tên sản phẩm <span className="text-rose-600">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Nhập tên sản phẩm"
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-rose-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-900">
                      Mô tả <span className="text-rose-600">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Nhập mô tả sản phẩm"
                      rows={6}
                      className="resize-none bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-sm text-rose-600">{errors.description.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Variants */}
              <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Biến thể sản phẩm</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
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
                      className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      onClick={() => append({
                        scent: '',
                        volumeMl: 50,
                        price: 0,
                        salePrice: undefined,
                        stock: 0,
                        barcode: '',
                      })}
                    >
                      <Plus className="mr-2 h-4 w-4 text-teal-600" />
                      Thêm biến thể
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">Biến thể {index + 1}</p>
                        {!isEditMode && fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => remove(index)}
                            aria-label={`Xóa biến thể ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`variants.${index}.scent`} className="text-xs font-medium text-slate-700">Mùi hương</Label>
                          <Input
                            id={`variants.${index}.scent`}
                            disabled={isEditMode}
                            className="bg-white border-slate-200 text-slate-900 focus-visible:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            {...register(`variants.${index}.scent`)}
                          />
                          {errors.variants?.[index]?.scent && (
                            <p className="text-sm text-rose-600">{errors.variants[index]?.scent?.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variants.${index}.volumeMl`} className="text-xs font-medium text-slate-700">Dung tích (ml)</Label>
                          <Input
                            id={`variants.${index}.volumeMl`}
                            type="number"
                            disabled={isEditMode}
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            {...register(`variants.${index}.volumeMl`, { valueAsNumber: true })}
                          />
                          {errors.variants?.[index]?.volumeMl && (
                            <p className="text-sm text-rose-600">{errors.variants[index]?.volumeMl?.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variants.${index}.stock`} className="text-xs font-medium text-slate-700">Tồn kho</Label>
                          <Input
                            id={`variants.${index}.stock`}
                            type="number"
                            disabled={isEditMode}
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                          />
                          {errors.variants?.[index]?.stock && (
                            <p className="text-sm text-rose-600">{errors.variants[index]?.stock?.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variants.${index}.price`} className="text-xs font-medium text-slate-700">Giá niêm yết</Label>
                          <Input
                            id={`variants.${index}.price`}
                            type="number"
                            disabled={isEditMode}
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            {...register(`variants.${index}.price`, { valueAsNumber: true })}
                          />
                          {errors.variants?.[index]?.price && (
                            <p className="text-sm text-rose-600">{errors.variants[index]?.price?.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variants.${index}.salePrice`} className="text-xs font-medium text-slate-700">Giá sale</Label>
                          <Input
                            id={`variants.${index}.salePrice`}
                            type="number"
                            disabled={isEditMode}
                            className="bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            {...register(`variants.${index}.salePrice`, {
                              setValueAs: (value) => value === '' ? undefined : Number(value),
                            })}
                          />
                          {errors.variants?.[index]?.salePrice && (
                            <p className="text-sm text-rose-600">{errors.variants[index]?.salePrice?.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`variants.${index}.barcode`} className="text-xs font-medium text-slate-700">Barcode</Label>
                          <Input
                            id={`variants.${index}.barcode`}
                            disabled={isEditMode}
                            className="bg-white border-slate-200 text-slate-900 font-mono focus-visible:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                            {...register(`variants.${index}.barcode`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.variants?.root && (
                    <p className="text-sm text-rose-600">{errors.variants.root.message}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 1 column: Images + Category & Pricing */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card 3: Images */}
              <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">Hình ảnh</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <ImageUpload
                      images={images}
                      onChange={(newImages) => {
                        setImages(newImages);
                        setValue('images', newImages, { shouldValidate: true });
                      }}
                      maxImages={5}
                    />
                    {errors.images && (
                      <p className="text-sm text-rose-600">{errors.images.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Category & Price */}
              <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">Phân loại & Giá</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="categoryId" className="text-sm font-medium text-slate-900">
                      Danh mục <span className="text-rose-600">*</span>
                    </Label>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={
                            `w-full justify-between h-10 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 ${!watch('categoryId') && "text-slate-400"
                            }`
                          }
                        >
                          <span className="truncate">
                            {watch('categoryId')
                              ? categories.find((c) => c.id === watch('categoryId'))?.displayName
                              : (categories.length > 0 ? "Chọn danh mục" : "Đang tải danh mục...")}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto bg-white border-slate-200 shadow-md" align="start">
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
                                    className="cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700"
                                  >
                                    <span className={watch('categoryId') === node.id ? "font-bold text-teal-600" : ""}>
                                      {node.name}
                                    </span>
                                  </DropdownMenuItem>
                                );
                              }

                              return (
                                <DropdownMenuSub key={node.id}>
                                  <DropdownMenuSubTrigger className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700">
                                    <span>{node.name}</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto bg-white border-slate-200 shadow-md">
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
                      <p className="text-sm text-rose-600">{errors.categoryId.message}</p>
                    )}
                  </div>

                  {/* Base Price */}
                  <div className="space-y-2">
                    <Label htmlFor="basePrice" className="text-sm font-medium text-slate-900">
                      Giá cơ bản <span className="text-rose-600">*</span>
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      placeholder="0"
                      className="bg-white border-slate-200 text-slate-900 tabular-nums placeholder:text-slate-400 focus-visible:ring-teal-500"
                      {...register('basePrice', { valueAsNumber: true })}
                    />
                    {errors.basePrice && (
                      <p className="text-sm text-rose-600">{errors.basePrice.message}</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                    <div>
                      <Label htmlFor="active" className="text-sm font-medium text-slate-900 cursor-pointer">Hiển thị sản phẩm</Label>
                      <p className="text-xs text-slate-400 mt-0.5">
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
            </div>
          </div>

          {/* Sticky Save Bar at Bottom */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {isEditMode ? `Đang chỉnh sửa: ${watch('name') || 'Sản phẩm'}` : 'Vui lòng kiểm tra kỹ thông tin trước khi lưu'}
            </span>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/products')}
                disabled={isSubmitting}
                className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[130px] rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500">
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
        </form>
      </div>
    </>
  );
}
