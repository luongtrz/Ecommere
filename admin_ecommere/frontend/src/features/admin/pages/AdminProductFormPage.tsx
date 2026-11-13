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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ArrowLeft,
  Loader2,
  Save,
  ChevronDown,
  Plus,
  Trash2,
  ExternalLink,
  Package,
  Search,
} from 'lucide-react';
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useAdminProducts';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/formatters';

const STORE_URL = import.meta.env.VITE_STORE_URL || 'http://localhost:5173';

// Form validation schema
const variantFormSchema = z
  .object({
    scent: z.string().min(1, 'Mùi hương là bắt buộc'),
    volumeMl: z
      .number({
        invalid_type_error: 'Dung tích phải lớn hơn 0',
        required_error: 'Dung tích phải lớn hơn 0',
      })
      .int()
      .min(1, 'Dung tích phải lớn hơn 0'),
    price: z
      .number({
        invalid_type_error: 'Giá phải lớn hơn hoặc bằng 0',
        required_error: 'Giá phải lớn hơn hoặc bằng 0',
      })
      .int()
      .min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    salePrice: z
      .number({
        invalid_type_error: 'Giá sale không được âm',
      })
      .int()
      .min(0, 'Giá sale không được âm')
      .nullable()
      .optional(),
    stock: z
      .number({
        invalid_type_error: 'Tồn kho không được âm',
        required_error: 'Tồn kho không được âm',
      })
      .int()
      .min(0, 'Tồn kho không được âm'),
    barcode: z.string().optional(),
  })
  .refine(
    (variant) =>
      variant.salePrice == null ||
      variant.price == null ||
      variant.salePrice <= variant.price,
    {
      path: ['salePrice'],
      message: 'Giá sale không được lớn hơn giá niêm yết',
    },
  );

const productFormSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  basePrice: z
    .number({
      invalid_type_error: 'Giá phải lớn hơn 0',
      required_error: 'Giá phải lớn hơn 0',
    })
    .int('Giá phải là số nguyên')
    .positive('Giá phải lớn hơn 0'),
  active: z.boolean(),
  variants: z
    .array(variantFormSchema)
    .min(1, 'Sản phẩm phải có ít nhất một biến thể'),
  images: z.array(z.string()).min(1, 'Vui lòng thêm ít nhất 1 ảnh'),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;

  // Dialog states
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<number | null>(null);
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] =
    useState(false);

  // Images state
  const [images, setImages] = useState<string[]>([]);

  // Fetch product data if editing
  const { data: product, isLoading: isLoadingProduct } = useAdminProduct(
    id || null,
  );

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Form
  const form = useForm<ProductFormData>({
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    watch,
  } = form;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'variants',
  });

  // Fetch categories tree and flatten to leaves only
  const [categories, setCategories] = useState<any[]>([]); // Flattened for lookup
  const [categoryTree, setCategoryTree] = useState<any[]>([]); // Tree for dropdown
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const tree = await import('../api/categories.api').then((m) =>
          m.categoriesApi.getTree(),
        );

        // Flatten tree but only keep leaves
        const allCategories: any[] = [];
        const traverse = (nodes: any[], prefix = '') => {
          nodes.forEach((node) => {
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
        (product.variants || []).map((variant) => ({
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

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
    } else {
      navigate('/admin/products');
    }
  };

  const handleDeleteVariantClick = (index: number) => {
    const v = watch(`variants.${index}`);
    const hasData =
      Boolean(v?.scent?.trim()) ||
      Boolean(v?.barcode?.trim()) ||
      (typeof v?.price === 'number' && v.price > 0) ||
      (typeof v?.stock === 'number' && v.stock > 0);

    if (hasData) {
      setVariantToDelete(index);
    } else {
      remove(index);
    }
  };

  const handleDeleteProduct = async () => {
    if (!id) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Đã xóa sản phẩm thành công!');
      navigate('/admin/products');
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const errorMessage = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : serverMessage || error.message || 'Không thể xóa sản phẩm';
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditMode && id) {
        const productData = { ...data };
        delete (productData as Partial<ProductFormData>).variants;

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
        <div className="py-24 flex items-center justify-center min-h-[50vh]">
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
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm max-w-md mx-auto my-12">
          <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-900 tracking-tight">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Sản phẩm có thể đã bị xóa hoặc đường dẫn không đúng. Vui lòng kiểm
            tra lại liên kết hoặc quay lại danh sách sản phẩm.
          </p>
          <Button
            asChild
            className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm font-medium transition-all duration-200 hover:shadow"
          >
            <Link to="/admin/products">Quay lại danh sách</Link>
          </Button>
        </div>
      </>
    );
  }

  const totalStock = isEditMode
    ? (product?.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)
    : (watch('variants') || []).reduce(
        (sum, v) => sum + (Number(v?.stock) || 0),
        0,
      );

  return (
    <>
      <SEO
        title={
          isEditMode
            ? `Chỉnh sửa sản phẩm - ${product?.name || ''}`
            : 'Thêm sản phẩm mới'
        }
      />
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-32 sm:pb-36 animate-in fade-in duration-200">
        {/* Dominant Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition-all duration-200 shrink-0"
            >
              <Link
                to="/admin/products"
                aria-label="Quay lại danh sách sản phẩm"
                onClick={(e) => {
                  if (isDirty) {
                    e.preventDefault();
                    setShowLeaveConfirm(true);
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h1>
                <Badge
                  variant={watch('active') ? 'success' : 'secondary'}
                  className={`px-2.5 py-0.5 text-xs font-medium ${
                    watch('active')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {watch('active') ? 'Đang bán' : 'Đang ẩn'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditMode
                  ? 'Cập nhật thông tin chi tiết, giá cơ bản và hình ảnh sản phẩm'
                  : 'Điền đầy đủ các thông tin để tạo sản phẩm mới vào danh mục'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end flex-wrap">
            {isEditMode && product?.slug && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all duration-200"
              >
                <a
                  href={`${STORE_URL}/products/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-4 w-4 text-slate-500" />
                  Xem trên web
                </a>
              </Button>
            )}
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteProductConfirm(true)}
                disabled={isSubmitting}
                className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium shadow-sm transition-all duration-200"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Xóa sản phẩm
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all duration-200"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="min-w-[130px] h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm font-medium transition-all duration-200 hover:shadow"
            >
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

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 columns: Basic info + Variants */}
              <div className="lg:col-span-2 space-y-6">
                {/* Card 1: Basic Info */}
                <Card className="border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow duration-200 rounded-xl overflow-hidden">
                  <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                      Thông tin chung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {/* Product Name */}
                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700">
                            Tên sản phẩm{' '}
                            <span className="text-rose-600">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập tên sản phẩm"
                              disabled={isSubmitting}
                              className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-rose-600" />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700">
                            Mô tả <span className="text-rose-600">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Nhập mô tả sản phẩm"
                              rows={6}
                              disabled={isSubmitting}
                              className="resize-none rounded-lg bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-rose-600" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Card 2: Variants */}
                <Card className="border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow duration-200 rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 bg-slate-50/50 gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                          Biến thể sản phẩm
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-xs font-normal text-slate-600 bg-white border-slate-200"
                        >
                          Tổng tồn kho:{' '}
                          <strong className="ml-1 text-slate-900 tabular-nums">
                            {totalStock}
                          </strong>{' '}
                          sản phẩm
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {isEditMode
                          ? 'Các biến thể hiện có được hiển thị để đối chiếu.'
                          : 'Thêm ít nhất một mùi hương và dung tích trước khi lưu sản phẩm.'}
                      </p>
                    </div>
                    {isEditMode ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-11 sm:h-9 min-h-[44px] sm:min-h-[36px] rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all duration-200 shrink-0"
                      >
                        <Link to="/admin/inventory">
                          <Package className="mr-2 h-4 w-4 text-teal-600" />
                          Quản lý tồn kho tại trang Kho hàng
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        className="h-11 sm:h-9 min-h-[44px] sm:min-h-[36px] rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all duration-200 shrink-0"
                        onClick={() =>
                          append({
                            scent: '',
                            volumeMl: 50,
                            price: 0,
                            salePrice: undefined,
                            stock: 0,
                            barcode: '',
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4 text-teal-600" />
                        Thêm biến thể
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {isEditMode ? (
                      /* Read-only summary table for existing product variants */
                      <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Biến thể
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Mùi hương
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Dung tích
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Tồn kho
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Giá niêm yết
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Giá sale
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Barcode
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product?.variants &&
                            product.variants.length > 0 ? (
                              product.variants.map((v, idx) => (
                                <TableRow key={v.id || idx}>
                                  <TableCell className="font-semibold text-slate-900 text-xs whitespace-nowrap">
                                    Biến thể {idx + 1}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-700 whitespace-nowrap">
                                    {v.scent || '—'}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-700 tabular-nums whitespace-nowrap">
                                    {v.volumeMl ? `${v.volumeMl} ml` : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">
                                    <span className="font-semibold tabular-nums text-slate-900">
                                      {v.stock ?? 0}
                                    </span>{' '}
                                    <span className="text-slate-500">
                                      sản phẩm
                                    </span>
                                    {v.stock === 0 && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-[10px] px-1.5 py-0"
                                      >
                                        Hết hàng
                                      </Badge>
                                    )}
                                    {v.stock > 0 && v.stock <= 5 && (
                                      <Badge
                                        variant="warning"
                                        className="ml-2 text-[10px] px-1.5 py-0"
                                      >
                                        Sắp hết
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                                    {typeof v.price === 'number'
                                      ? formatCurrency(v.price)
                                      : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-700 tabular-nums whitespace-nowrap">
                                    {typeof v.salePrice === 'number' &&
                                    v.salePrice > 0 ? (
                                      <span className="text-teal-600 font-semibold">
                                        {formatCurrency(v.salePrice)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap">
                                    {v.barcode || '—'}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center text-xs text-slate-400 py-6"
                                >
                                  Không có biến thể nào
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      /* Editable variant cards in create mode */
                      fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:border-slate-300"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">
                              Biến thể {index + 1}
                            </p>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={isSubmitting}
                                className="h-9 w-9 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                onClick={() => handleDeleteVariantClick(index)}
                                aria-label={`Xóa biến thể ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`variants.${index}.scent`}
                                className="text-xs font-semibold text-slate-700"
                              >
                                Mùi hương{' '}
                                <span className="text-rose-600">*</span>
                              </Label>
                              <Input
                                id={`variants.${index}.scent`}
                                placeholder="VD: Hương Gỗ"
                                disabled={isSubmitting}
                                className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg bg-white border-slate-200 text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                                {...register(`variants.${index}.scent`)}
                              />
                              {errors.variants?.[index]?.scent && (
                                <p className="text-xs font-medium text-rose-600">
                                  {errors.variants[index]?.scent?.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`variants.${index}.volumeMl`}
                                className="text-xs font-semibold text-slate-700"
                              >
                                Dung tích (ml){' '}
                                <span className="text-rose-600">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`variants.${index}.volumeMl`}
                                  type="number"
                                  placeholder="50"
                                  disabled={isSubmitting}
                                  className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] pr-10 rounded-lg bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                                  onFocus={(e) => e.target.select()}
                                  {...register(`variants.${index}.volumeMl`, {
                                    setValueAs: (v) =>
                                      v === '' || Number.isNaN(Number(v))
                                        ? undefined
                                        : Number(v),
                                  })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none select-none">
                                  ml
                                </span>
                              </div>
                              {errors.variants?.[index]?.volumeMl && (
                                <p className="text-xs font-medium text-rose-600">
                                  {errors.variants[index]?.volumeMl?.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`variants.${index}.stock`}
                                className="text-xs font-semibold text-slate-700"
                              >
                                Tồn kho <span className="text-rose-600">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`variants.${index}.stock`}
                                  type="number"
                                  placeholder="0"
                                  disabled={isSubmitting}
                                  className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] pr-16 rounded-lg bg-white border-slate-200 text-slate-900 tabular-nums focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                                  onFocus={(e) => e.target.select()}
                                  {...register(`variants.${index}.stock`, {
                                    setValueAs: (v) =>
                                      v === '' || Number.isNaN(Number(v))
                                        ? undefined
                                        : Number(v),
                                  })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none select-none">
                                  sản phẩm
                                </span>
                              </div>
                              {errors.variants?.[index]?.stock && (
                                <p className="text-xs font-medium text-rose-600">
                                  {errors.variants[index]?.stock?.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`variants.${index}.price`}
                                className="text-xs font-semibold text-slate-700"
                              >
                                Giá niêm yết{' '}
                                <span className="text-rose-600">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`variants.${index}.price`}
                                  type="number"
                                  placeholder="0"
                                  disabled={isSubmitting}
                                  className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] pr-8 rounded-lg bg-white border-slate-200 text-slate-900 tabular-nums font-medium focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                                  onFocus={(e) => e.target.select()}
                                  {...register(`variants.${index}.price`, {
                                    setValueAs: (v) =>
                                      v === '' || Number.isNaN(Number(v))
                                        ? undefined
                                        : Number(v),
                                  })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none font-medium">
                                  ₫
                                </span>
                              </div>
                              {errors.variants?.[index]?.price && (
                                <p className="text-xs font-medium text-rose-600">
                                  {errors.variants[index]?.price?.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`variants.${index}.salePrice`}
                                className="text-xs font-semibold text-slate-700"
                              >
                                Giá sale{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (Không bắt buộc)
                                </span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`variants.${index}.salePrice`}
                                  type="number"
                                  placeholder="0"
                                  disabled={isSubmitting}
                                  className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] pr-8 rounded-lg bg-white border-slate-200 text-slate-900 tabular-nums font-medium focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm text-base sm:text-sm"
                                  onFocus={(e) => e.target.select()}
                                  {...register(`variants.${index}.salePrice`, {
                                    setValueAs: (value) =>
                                      value === '' ||
                                      value === null ||
                                      value === undefined
                                        ? undefined
                                        : Number(value),
                                  })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none font-medium">
                                  ₫
                                </span>
                              </div>
                              {errors.variants?.[index]?.salePrice && (
                                <p className="text-xs font-medium text-rose-600">
                                  {errors.variants[index]?.salePrice?.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`variants.${index}.barcode`}
                                className="text-xs font-semibold text-slate-700"
                              >
                                Barcode{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (Không bắt buộc)
                                </span>
                              </Label>
                              <Input
                                id={`variants.${index}.barcode`}
                                placeholder="Mã vạch (EAN/UPC)"
                                disabled={isSubmitting}
                                className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg bg-white border-slate-200 text-slate-900 font-mono text-base sm:text-xs focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm"
                                {...register(`variants.${index}.barcode`)}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {errors.variants && (
                      <p className="text-xs font-medium text-rose-600 mt-2">
                        {errors.variants.root?.message ||
                          (errors.variants as any)?.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right 1 column: Images + Category & Pricing */}
              <div className="lg:col-span-1 space-y-6">
                {/* Card 3: Images */}
                <Card className="border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow duration-200 rounded-xl overflow-hidden">
                  <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                      Hình ảnh <span className="text-rose-600">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <ImageUpload
                        images={images}
                        onChange={(newImages) => {
                          setImages(newImages);
                          setValue('images', newImages, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        maxImages={5}
                      />
                      {errors.images && (
                        <p className="text-xs font-medium text-rose-600">
                          {errors.images.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Card 4: Category & Price */}
                <Card className="border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow duration-200 rounded-xl overflow-hidden">
                  <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                      Phân loại & Giá
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {/* Category */}
                    <FormField
                      control={control}
                      name="categoryId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700">
                            Danh mục <span className="text-rose-600">*</span>
                          </FormLabel>
                          <FormControl>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={`w-full justify-between h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] rounded-lg border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-sm transition-colors text-base sm:text-sm ${
                                    !watch('categoryId') && 'text-slate-400'
                                  }`}
                                >
                                  <span className="truncate">
                                    {watch('categoryId')
                                      ? categories.find(
                                          (c) => c.id === watch('categoryId'),
                                        )?.displayName
                                      : categories.length > 0
                                        ? 'Chọn danh mục'
                                        : 'Đang tải danh mục...'}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                className="w-[calc(100vw-2rem)] sm:w-[350px] max-h-[320px] overflow-y-auto bg-white border-slate-200 shadow-lg rounded-xl p-2"
                                align="start"
                              >
                                <div className="pb-2 mb-2 border-b border-slate-100">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                    <Input
                                      placeholder="Tìm kiếm danh mục..."
                                      value={categorySearch}
                                      onChange={(e) =>
                                        setCategorySearch(e.target.value)
                                      }
                                      className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                                  {categorySearch.trim()
                                    ? categories
                                        .filter((cat) =>
                                          cat.displayName
                                            .toLowerCase()
                                            .includes(
                                              categorySearch
                                                .toLowerCase()
                                                .trim(),
                                            ),
                                        )
                                        .map((cat) => (
                                          <DropdownMenuItem
                                            key={cat.id}
                                            onClick={() => {
                                              setValue('categoryId', cat.id, {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                              });
                                            }}
                                            className="cursor-pointer rounded-lg px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700 transition-colors"
                                          >
                                            <span
                                              className={
                                                watch('categoryId') === cat.id
                                                  ? 'font-bold text-teal-600'
                                                  : ''
                                              }
                                            >
                                              {cat.displayName}
                                            </span>
                                          </DropdownMenuItem>
                                        ))
                                    : categoryTree.map((parent) => {
                                        const hasChildren =
                                          parent.children &&
                                          parent.children.length > 0;
                                        if (hasChildren) {
                                          return (
                                            <div
                                              key={parent.id}
                                              className="space-y-0.5"
                                            >
                                              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
                                                {parent.name}
                                              </div>
                                              {parent.children.map(
                                                (child: any) => (
                                                  <DropdownMenuItem
                                                    key={child.id}
                                                    onClick={() => {
                                                      setValue(
                                                        'categoryId',
                                                        child.id,
                                                        {
                                                          shouldValidate: true,
                                                          shouldDirty: true,
                                                        },
                                                      );
                                                    }}
                                                    className="cursor-pointer rounded-lg px-2.5 py-2 pl-4 text-xs text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700 transition-colors"
                                                  >
                                                    <span
                                                      className={
                                                        watch('categoryId') ===
                                                        child.id
                                                          ? 'font-bold text-teal-600'
                                                          : ''
                                                      }
                                                    >
                                                      {child.name}
                                                    </span>
                                                  </DropdownMenuItem>
                                                ),
                                              )}
                                            </div>
                                          );
                                        }
                                        return (
                                          <DropdownMenuItem
                                            key={parent.id}
                                            onClick={() => {
                                              setValue(
                                                'categoryId',
                                                parent.id,
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                },
                                              );
                                            }}
                                            className="cursor-pointer rounded-lg px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700 transition-colors"
                                          >
                                            <span
                                              className={
                                                watch('categoryId') ===
                                                parent.id
                                                  ? 'font-bold text-teal-600'
                                                  : ''
                                              }
                                            >
                                              {parent.name}
                                            </span>
                                          </DropdownMenuItem>
                                        );
                                      })}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage className="text-xs font-medium text-rose-600" />
                        </FormItem>
                      )}
                    />

                    {/* Base Price */}
                    <FormField
                      control={control}
                      name="basePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700">
                            Giá cơ bản <span className="text-rose-600">*</span>
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                disabled={isSubmitting}
                                className="h-11 sm:h-10 min-h-[44px] sm:min-h-[40px] pr-8 rounded-lg bg-white border-slate-200 text-slate-900 tabular-nums font-bold text-base sm:text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors shadow-sm"
                                value={
                                  field.value === undefined ||
                                  field.value === null
                                    ? ''
                                    : field.value
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val === '' || Number.isNaN(Number(val))
                                      ? undefined
                                      : Number(val),
                                  );
                                }}
                                onFocus={(e) => e.target.select()}
                              />
                            </FormControl>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none font-medium">
                              ₫
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Giá tham chiếu hiển thị trên danh mục trước khi
                            khách chọn biến thể
                          </p>
                          {typeof field.value === 'number' &&
                            field.value > 0 && (
                              <p className="text-xs text-teal-700 font-medium">
                                Xem trước: {formatCurrency(field.value)}
                              </p>
                            )}
                          <FormMessage className="text-xs font-medium text-rose-600" />
                        </FormItem>
                      )}
                    />

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="active"
                            className="text-sm font-semibold text-slate-900 cursor-pointer"
                          >
                            Hiển thị sản phẩm
                          </Label>
                          <span
                            className={`text-xs font-semibold ${
                              watch('active')
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            ({watch('active') ? 'Đang bán' : 'Đang ẩn'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sản phẩm tắt sẽ không xuất hiện trong cửa hàng trực
                          tuyến.
                        </p>
                      </div>
                      <Switch
                        id="active"
                        checked={watch('active')}
                        onCheckedChange={(checked) =>
                          setValue('active', checked, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        aria-label="Hiển thị sản phẩm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sticky Save Bar at Bottom */}
            <div className="sticky bottom-0 sm:bottom-4 z-20 bg-white/95 backdrop-blur-md border-t sm:border border-slate-200 shadow-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:mr-16 transition-all duration-200">
              <span className="text-xs font-medium text-slate-500 truncate">
                {isEditMode
                  ? `Đang chỉnh sửa: ${watch('name') || product?.name || 'Sản phẩm'}${
                      product?.id ? ` (Mã SP: #${product.id.slice(-6)})` : ''
                    }`
                  : 'Vui lòng kiểm tra kỹ thông tin trước khi lưu'}
              </span>
              <div className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all duration-200 h-10"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[130px] rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm font-medium transition-all duration-200 hover:shadow h-10"
                >
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
        </Form>
      </div>

      {/* Confirmation Dialog: Unsaved Changes on Exit / Cancel */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận hủy thay đổi</DialogTitle>
            <DialogDescription>
              Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi? Mọi thông tin
              vừa nhập sẽ bị mất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLeaveConfirm(false)}
            >
              Tiếp tục chỉnh sửa
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setShowLeaveConfirm(false);
                navigate('/admin/products');
              }}
            >
              Rời đi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Variant Deletion */}
      <Dialog
        open={variantToDelete !== null}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa biến thể</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa biến thể{' '}
              {variantToDelete !== null ? variantToDelete + 1 : ''}? Mọi thông
              tin đã nhập sẽ bị mất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVariantToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (variantToDelete !== null) {
                  remove(variantToDelete);
                  setVariantToDelete(null);
                }
              }}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Product Deletion in Edit Mode */}
      <Dialog
        open={showDeleteProductConfirm}
        onOpenChange={setShowDeleteProductConfirm}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm &quot;{product?.name}&quot;?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteProductConfirm(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
