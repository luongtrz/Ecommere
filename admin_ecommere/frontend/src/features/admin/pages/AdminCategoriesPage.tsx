import { useState, useMemo } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FolderTree,
  FileText,
  Loader2,
  AlertCircle,
  Search,
  Save,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, categoriesApi } from '../api/categories.api';
import { useToast } from '@/hooks/useToast';
import { QUERY_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  category: Category;
  level: number;
  selectedId: string | null;
  onSelect: (category: Category) => void;
  onAddChild: (parentId: string, parentName: string) => void;
  onDelete: (category: Category) => void;
}

function CategoryTreeNode({
  category,
  level,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer group border text-xs md:text-sm',
          isSelected
            ? 'bg-teal-50 border-teal-200 text-teal-900 font-medium shadow-sm'
            : 'border-transparent hover:bg-slate-100/80 hover:border-slate-200 text-slate-800'
        )}
        style={{ paddingLeft: `${Math.max(8, level * 16 + 8)}px` }}
        onClick={() => onSelect(category)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {category.isLeaf ? (
          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <FolderTree className="h-4 w-4 text-teal-600 shrink-0" />
        )}

        <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
          <span className="truncate">{category.name}</span>
          <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border-0 ring-1 ring-slate-200 shrink-0">
            {category.productCount || 0} SP
          </span>
          {!category.isLeaf && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border-0 ring-1 ring-teal-200 shrink-0">
              Mục cha
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(category.id, category.name);
            }}
            title="Thêm danh mục con"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
            disabled={hasChildren || (category.productCount !== undefined && category.productCount > 0)}
            title="Xóa danh mục"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-1">
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminCategoriesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activePaneTab, setActivePaneTab] = useState<'tree' | 'detail'>('tree');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [parentNameHint, setParentNameHint] = useState<string>('');
  const [treeSearch, setTreeSearch] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { data: treeData = [], isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: () => categoriesApi.getTree(),
  });

  const { data: flatCategories = [] } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES, 'flat'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: string }) => categoriesApi.create(data),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success(`Tạo danh mục "${newCat.name}" thành công`);
      setIsCreatingNew(false);
      setSelectedCategory(newCat);
      setFormName(newCat.name);
      setFormParentId(newCat.parentId || null);
      setActivePaneTab('detail');
    },
    onError: (error: any) => {
      toast.error('Không thể tạo danh mục: ' + (error.response?.data?.message || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; parentId?: string } }) =>
      categoriesApi.update(id, data),
    onSuccess: (updatedCat) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success('Cập nhật danh mục thành công');
      setSelectedCategory(updatedCat);
      setFormName(updatedCat.name);
      setFormParentId(updatedCat.parentId || null);
    },
    onError: (error: any) => {
      toast.error('Không thể cập nhật danh mục: ' + (error.response?.data?.message || error.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success('Xóa danh mục thành công');
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      if (selectedCategory?.id === categoryToDelete?.id) {
        setSelectedCategory(null);
        setIsCreatingNew(false);
        setFormName('');
        setFormParentId(null);
      }
    },
    onError: (error: any) => {
      toast.error('Không thể xóa danh mục: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsCreatingNew(false);
    setFormName(category.name);
    setFormParentId(category.parentId || null);
    setParentNameHint('');
    setActivePaneTab('detail');
  };

  const handleStartAddRoot = () => {
    setSelectedCategory(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormParentId(null);
    setParentNameHint('Danh mục gốc');
    setActivePaneTab('detail');
  };

  const handleStartAddChild = (parentId: string, parentName: string) => {
    setSelectedCategory(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormParentId(parentId);
    setParentNameHint(parentName);
    setActivePaneTab('detail');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) return;

    if (isCreatingNew) {
      createMutation.mutate({
        name: trimmed,
        parentId: formParentId || undefined,
      });
    } else if (selectedCategory) {
      updateMutation.mutate({
        id: selectedCategory.id,
        data: {
          name: trimmed,
          parentId: formParentId || undefined,
        },
      });
    }
  };

  const filteredTree = useMemo(() => {
    if (!treeSearch.trim()) return treeData;
    const lower = treeSearch.toLowerCase();

    const filterNodes = (nodes: Category[]): Category[] => {
      return nodes
        .map((node) => {
          const matchSelf = node.name.toLowerCase().includes(lower);
          const filteredChildren = node.children ? filterNodes(node.children) : [];
          if (matchSelf || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter(Boolean) as Category[];
    };

    return filterNodes(treeData);
  }, [treeData, treeSearch]);

  const totalCategoriesCount = flatCategories.length;

  return (
    <>
      <SEO title="Quản lý danh mục - Admin" />
      <div className="min-h-screen bg-slate-50 font-sans space-y-8 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Quản lý danh mục
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Cấu trúc danh mục sản phẩm theo mô hình phân cấp cha và con
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
              Tải lại
            </Button>
            <Button
              size="sm"
              onClick={handleStartAddRoot}
              className="gap-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium"
            >
              <Plus className="h-4 w-4" />
              Thêm danh mục gốc
            </Button>
          </div>
        </div>

        {/* Mobile View Switcher (Collapsing on mobile) */}
        <div className="flex lg:hidden rounded-lg border border-slate-200 p-1 bg-slate-100">
          <button
            type="button"
            onClick={() => setActivePaneTab('tree')}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-colors text-center',
              activePaneTab === 'tree'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Cây danh mục ({totalCategoriesCount})
          </button>
          <button
            type="button"
            onClick={() => setActivePaneTab('detail')}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-colors text-center',
              activePaneTab === 'detail'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {isCreatingNew
              ? 'Tạo danh mục mới'
              : selectedCategory
              ? `Chi tiết: ${selectedCategory.name}`
              : 'Chi tiết danh mục'}
          </button>
        </div>

        {/* Two-Pane Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Tree Hierarchy */}
          <div
            className={cn(
              'lg:col-span-5 space-y-4',
              activePaneTab === 'detail' ? 'hidden lg:block' : 'block'
            )}
          >
            <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Cây phân cấp danh mục
                    </CardTitle>
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-0 ring-1 ring-teal-200 tabular-nums text-xs font-medium">
                      {totalCategoriesCount}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStartAddRoot}
                    className="h-8 px-2.5 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg font-medium"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm gốc
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Tìm nhanh danh mục..."
                    className="pl-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    <span className="text-xs text-slate-500 font-medium">
                      Đang tải sơ đồ danh mục...
                    </span>
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    <FolderTree className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    Chưa có danh mục nào phù hợp. Hãy tạo danh mục đầu tiên để bắt đầu phân loại sản phẩm.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredTree.map((category) => (
                      <CategoryTreeNode
                        key={category.id}
                        category={category}
                        level={0}
                        selectedId={selectedCategory?.id || null}
                        onSelect={handleSelectCategory}
                        onAddChild={handleStartAddChild}
                        onDelete={(cat) => {
                          setCategoryToDelete(cat);
                          setIsDeleteOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Pane: Detail Form */}
          <div
            className={cn(
              'lg:col-span-7 space-y-4',
              activePaneTab === 'tree' ? 'hidden lg:block' : 'block'
            )}
          >
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePaneTab('tree')}
                className="gap-2 text-xs text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Quay lại cây danh mục
              </Button>
            </div>

            <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden sticky top-6">
              <CardHeader className="border-b border-slate-200 p-4 md:p-6 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg md:text-xl font-semibold text-slate-900">
                      {isCreatingNew
                        ? formParentId
                          ? `Thêm danh mục con cho "${parentNameHint}"`
                          : 'Thêm danh mục gốc mới'
                        : selectedCategory
                        ? `Chỉnh sửa danh mục: ${selectedCategory.name}`
                        : 'Chi tiết danh mục'}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 mt-0.5">
                      {isCreatingNew
                        ? 'Nhập tên và cấu hình vị trí nhánh cho danh mục mới'
                        : selectedCategory
                        ? 'Chỉnh sửa thông tin phân cấp và tên hiển thị của danh mục'
                        : 'Chọn một danh mục từ cây bên trái để xem chi tiết hoặc chỉnh sửa'}
                    </CardDescription>
                  </div>
                  {isCreatingNew ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs font-medium">
                      Tạo mới
                    </Badge>
                  ) : selectedCategory ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs font-medium">
                      Chỉnh sửa
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6">
                {!isCreatingNew && !selectedCategory ? (
                  <div className="text-center py-16 space-y-4">
                    <FolderTree className="h-12 w-12 mx-auto text-slate-300" />
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Chưa chọn danh mục</h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                        Nhấn vào một danh mục bất kỳ ở cây bên trái để xem thông tin chi tiết, hoặc bấm nút dưới đây để tạo mới.
                      </p>
                    </div>
                    <Button
                      onClick={handleStartAddRoot}
                      className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Tạo danh mục mới
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Section 1: Thông tin cơ bản */}
                    <div className="space-y-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Thông tin cơ bản
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categoryName" className="text-sm font-medium text-slate-900">
                          Tên danh mục *
                        </Label>
                        <Input
                          id="categoryName"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ví dụ: Xịt phòng thảo mộc..."
                          className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
                        />
                      </div>

                      {selectedCategory && (
                        <div className="space-y-2">
                          <Label htmlFor="categorySlug" className="text-sm font-medium text-slate-900">
                            Đường dẫn (Slug)
                          </Label>
                          <Input
                            id="categorySlug"
                            readOnly
                            disabled
                            value={selectedCategory.slug}
                            className="bg-slate-50 border border-slate-200 text-slate-500 font-mono text-xs rounded-lg h-10"
                          />
                        </div>
                      )}
                    </div>

                    {/* Section 2: Vị trí phân cấp */}
                    <div className="space-y-4 border-t border-slate-200 pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Vị trí trong phân cấp
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parentCategory" className="text-sm font-medium text-slate-900">
                          Danh mục cha
                        </Label>
                        <select
                          id="parentCategory"
                          value={formParentId || ''}
                          onChange={(e) => setFormParentId(e.target.value || null)}
                          className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                        >
                          <option value="">-- Là danh mục gốc (không có mục cha) --</option>
                          {flatCategories
                            .filter((c) => !selectedCategory || c.id !== selectedCategory.id)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500">
                          {formParentId
                            ? 'Danh mục này sẽ xuất hiện dưới dạng nhánh con của mục đã chọn.'
                            : 'Danh mục này nằm ở cấp cao nhất trên thanh điều hướng.'}
                        </p>
                      </div>
                    </div>

                    {/* Section 3: Thống kê & Trạng thái */}
                    {selectedCategory && (
                      <div className="space-y-4 border-t border-slate-200 pt-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Thống kê & Trạng thái
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                            <span className="text-xs text-slate-500">Sản phẩm liên kết</span>
                            <div className="text-xl font-bold tabular-nums text-slate-900 mt-1">
                              {selectedCategory.productCount || 0}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                            <span className="text-xs text-slate-500">Cấu trúc nhánh</span>
                            <div className="mt-1">
                              {selectedCategory.isLeaf ? (
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-0 ring-1 ring-slate-200 text-xs font-medium">
                                  Mục lá (Không có con)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs font-medium">
                                  Mục cha ({selectedCategory.children?.length || 0} mục con)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
                      <div>
                        {selectedCategory && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCategoryToDelete(selectedCategory);
                              setIsDeleteOpen(true);
                            }}
                            disabled={
                              (selectedCategory.children && selectedCategory.children.length > 0) ||
                              (selectedCategory.productCount !== undefined && selectedCategory.productCount > 0)
                            }
                            className="rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Xóa danh mục
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isCreatingNew) {
                              setIsCreatingNew(false);
                            } else {
                              setSelectedCategory(null);
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
                        >
                          Hủy / Bỏ chọn
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            createMutation.isPending ||
                            updateMutation.isPending ||
                            !formName.trim()
                          }
                          className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium gap-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500"
                        >
                          {(createMutation.isPending || updateMutation.isPending) && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          <Save className="h-3.5 w-3.5" />
                          {isCreatingNew ? 'Tạo mới' : 'Lưu thay đổi'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl p-0 gap-0 overflow-hidden font-sans">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 ring-1 ring-rose-200">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Xác nhận xóa danh mục
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    Hành động này không thể hoàn tác
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục{' '}
              <span className="font-semibold text-slate-900">"{categoryToDelete?.name}"</span>?
              Thao tác này chỉ thực hiện được khi danh mục không có chứa sản phẩm hoặc danh mục con nào.
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-slate-50 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium"
                disabled={deleteMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm font-medium focus-visible:ring-2 focus-visible:ring-rose-500 gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xác nhận xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
