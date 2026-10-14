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
          'flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer group border text-xs md:text-sm',
          isSelected
            ? 'bg-primary/10 border-primary text-foreground font-medium shadow-sm'
            : 'border-transparent hover:bg-muted/40 hover:border-border text-foreground'
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
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {category.isLeaf ? (
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <FolderTree className="h-4 w-4 text-amber-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
          <span className="truncate">{category.name}</span>
          <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
            {category.productCount || 0} SP
          </span>
          {!category.isLeaf && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
              Mục cha
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
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
            className="h-7 w-7 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Quản lý danh mục
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cấu trúc danh mục sản phẩm theo mô hình phân cấp cha và con
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 rounded-xl border-border bg-background hover:bg-muted text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Tải lại
            </Button>
            <Button
              size="sm"
              onClick={handleStartAddRoot}
              className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Thêm danh mục gốc
            </Button>
          </div>
        </div>

        {/* Mobile View Switcher (Collapsing on mobile) */}
        <div className="flex lg:hidden rounded-xl border border-border p-1 bg-muted/20">
          <button
            type="button"
            onClick={() => setActivePaneTab('tree')}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-lg transition-colors text-center',
              activePaneTab === 'tree'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Cây danh mục ({totalCategoriesCount})
          </button>
          <button
            type="button"
            onClick={() => setActivePaneTab('detail')}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-lg transition-colors text-center',
              activePaneTab === 'detail'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Cây phân cấp danh mục
                    </CardTitle>
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 tabular-nums text-xs">
                      {totalCategoriesCount}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStartAddRoot}
                    className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm gốc
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Tìm nhanh danh mục..."
                    className="pl-8 h-8 rounded-lg bg-background border-input text-foreground text-xs focus-visible:ring-ring"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Đang tải sơ đồ danh mục...
                    </span>
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    <FolderTree className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
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
                className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Quay lại cây danh mục
              </Button>
            </div>

            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden sticky top-6">
              <CardHeader className="border-b border-border p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg md:text-xl font-semibold text-foreground">
                      {isCreatingNew
                        ? formParentId
                          ? `Thêm danh mục con cho "${parentNameHint}"`
                          : 'Thêm danh mục gốc mới'
                        : selectedCategory
                        ? `Chỉnh sửa danh mục: ${selectedCategory.name}`
                        : 'Chi tiết danh mục'}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {isCreatingNew
                        ? 'Nhập tên và cấu hình vị trí nhánh cho danh mục mới'
                        : selectedCategory
                        ? 'Chỉnh sửa thông tin phân cấp và tên hiển thị của danh mục'
                        : 'Chọn một danh mục từ cây bên trái để xem chi tiết hoặc chỉnh sửa'}
                    </CardDescription>
                  </div>
                  {isCreatingNew ? (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 text-xs">
                      Tạo mới
                    </Badge>
                  ) : selectedCategory ? (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/25 text-xs">
                      Chỉnh sửa
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6">
                {!isCreatingNew && !selectedCategory ? (
                  <div className="text-center py-16 space-y-4">
                    <FolderTree className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Chưa chọn danh mục</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Nhấn vào một danh mục bất kỳ ở cây bên trái để xem thông tin chi tiết, hoặc bấm nút dưới đây để tạo mới.
                      </p>
                    </div>
                    <Button
                      onClick={handleStartAddRoot}
                      className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Tạo danh mục mới
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Section 1: Thông tin cơ bản */}
                    <div className="space-y-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Thông tin cơ bản
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categoryName" className="text-sm font-medium text-foreground">
                          Tên danh mục *
                        </Label>
                        <Input
                          id="categoryName"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ví dụ: Xịt phòng thảo mộc..."
                          className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
                        />
                      </div>

                      {selectedCategory && (
                        <div className="space-y-2">
                          <Label htmlFor="categorySlug" className="text-sm font-medium text-foreground">
                            Đường dẫn (Slug)
                          </Label>
                          <Input
                            id="categorySlug"
                            readOnly
                            disabled
                            value={selectedCategory.slug}
                            className="bg-muted/40 border-border text-muted-foreground font-mono text-xs rounded-xl h-10"
                          />
                        </div>
                      )}
                    </div>

                    {/* Section 2: Vị trí phân cấp */}
                    <div className="space-y-4 border-t border-border pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vị trí trong phân cấp
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parentCategory" className="text-sm font-medium text-foreground">
                          Danh mục cha
                        </Label>
                        <select
                          id="parentCategory"
                          value={formParentId || ''}
                          onChange={(e) => setFormParentId(e.target.value || null)}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        <p className="text-xs text-muted-foreground">
                          {formParentId
                            ? 'Danh mục này sẽ xuất hiện dưới dạng nhánh con của mục đã chọn.'
                            : 'Danh mục này nằm ở cấp cao nhất trên thanh điều hướng.'}
                        </p>
                      </div>
                    </div>

                    {/* Section 3: Thống kê & Trạng thái */}
                    {selectedCategory && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Thống kê & Trạng thái
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl border border-border bg-muted/20">
                            <span className="text-xs text-muted-foreground">Sản phẩm liên kết</span>
                            <div className="text-xl font-bold tabular-nums text-foreground mt-1">
                              {selectedCategory.productCount || 0}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-border bg-muted/20">
                            <span className="text-xs text-muted-foreground">Cấu trúc nhánh</span>
                            <div className="mt-1">
                              {selectedCategory.isLeaf ? (
                                <Badge variant="outline" className="bg-slate-500/15 text-slate-300 border-slate-500/25 text-xs">
                                  Mục lá (Không có con)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/25 text-xs">
                                  Mục cha ({selectedCategory.children?.length || 0} mục con)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
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
                            className="rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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
                          className="rounded-xl border-border bg-background hover:bg-muted text-foreground text-xs"
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
                          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5"
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
          <DialogContent className="max-w-md bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Xác nhận xóa danh mục
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Hành động này không thể hoàn tác
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 text-sm text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục{' '}
              <span className="font-semibold text-foreground">"{categoryToDelete?.name}"</span>?
              Thao tác này chỉ thực hiện được khi danh mục không có chứa sản phẩm hoặc danh mục con nào.
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-xl border-border bg-background hover:bg-muted text-foreground"
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
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
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
