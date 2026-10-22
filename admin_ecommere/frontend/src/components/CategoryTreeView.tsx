import { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash,
  FolderTree,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Category, categoriesApi } from '@/features/admin/api/categories.api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { QUERY_KEYS } from '@/lib/constants';

interface CategoryTreeNodeProps {
  category: Category;
  level: number;
  onAddChild: (parentId: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (category: Category) => void;
}

function CategoryTreeNode({
  category,
  level,
  onAddChild,
  onEdit,
  onDelete,
}: CategoryTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="border-l-2 border-slate-200 hover:border-slate-300 transition-colors pl-1 sm:pl-2">
      <div
        className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors group"
        style={{ marginLeft: `${level * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6 shrink-0" />
        )}

        {category.isLeaf ? (
          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <FolderTree className="h-4 w-4 text-amber-500 shrink-0" />
        )}

        <div className="flex-1 min-w-0 flex items-center flex-wrap gap-1.5">
          <span className="font-medium text-slate-900 truncate text-sm">
            {category.name}
          </span>
          <span className="text-xs text-slate-600 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full tabular-nums">
            {category.productCount || 0} sản phẩm
          </span>
          {!category.isLeaf && (
            <span className="text-[10px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 rounded-full">
              Mục cha
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 p-0"
            onClick={() => onAddChild(category.id)}
            title="Thêm danh mục con"
          >
            <Plus className="h-4 w-4 text-teal-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 p-0"
            onClick={() => onEdit(category.id, category.name)}
            title="Chỉnh sửa"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 p-0"
            onClick={() => onDelete(category)}
            disabled={
              hasChildren ||
              (category.productCount !== undefined && category.productCount > 0)
            }
            title="Xóa"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="ml-1 sm:ml-2">
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTreeView() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Dialog state for add/edit category
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog state for delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getTree();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories tree:', error);
      toast.error('Không thể tải sơ đồ danh mục.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const openAddDialog = (parentId: string | null) => {
    setDialogMode('add');
    setCategoryNameInput('');
    setActiveParentId(parentId);
    setActiveCategoryId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: string, name: string) => {
    setDialogMode('edit');
    setCategoryNameInput(name);
    setActiveParentId(null);
    setActiveCategoryId(id);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryNameInput.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      if (dialogMode === 'add') {
        await categoriesApi.create({
          name,
          parentId: activeParentId || undefined,
        });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
        toast.success(`Tạo danh mục "${name}" thành công`);
      } else if (dialogMode === 'edit' && activeCategoryId) {
        await categoriesApi.update(activeCategoryId, { name });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
        toast.success('Cập nhật tên danh mục thành công');
      }
      setIsDialogOpen(false);
      await fetchTree();
    } catch (error: any) {
      toast.error(
        'Thao tác thất bại: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      await categoriesApi.delete(categoryToDelete.id);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success(`Xóa danh mục "${categoryToDelete.name}" thành công`);
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      await fetchTree();
    } catch (error: any) {
      toast.error(
        'Không thể xóa danh mục: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="text-sm text-slate-500 font-medium">
          Đang tải sơ đồ danh mục...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Cấu trúc danh mục
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kéo sản phẩm theo nhánh cha/con để tối ưu hóa điều hướng
          </p>
        </div>
        <Button
          onClick={() => openAddDialog(null)}
          className="rounded-lg shrink-0 bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục gốc
        </Button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FolderTree className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            Chưa có danh mục nào. Hãy tạo danh mục đầu tiên để bắt đầu phân loại
            sản phẩm.
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <CategoryTreeNode
                key={category.id}
                category={category}
                level={0}
                onAddChild={openAddDialog}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {dialogMode === 'add'
                ? 'Thêm danh mục mới'
                : 'Chỉnh sửa tên danh mục'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDialogSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label
                htmlFor="categoryName"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Tên danh mục
              </label>
              <Input
                id="categoryName"
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                placeholder="Nhập tên danh mục..."
                className="h-10 rounded-lg bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                required
              />
            </div>
            <DialogFooter className="pt-4 border-t border-slate-100 mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-lg h-10 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !categoryNameInput.trim()}
                className="rounded-lg h-10 bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {dialogMode === 'add' ? 'Tạo mới' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Xóa danh mục này?
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-center text-sm text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn xóa danh mục{' '}
            <span className="font-semibold text-slate-900">
              "{categoryToDelete?.name}"
            </span>
            ? Hành động này không thể hoàn tác và chỉ có thể thực hiện nếu danh
            mục không có chứa sản phẩm hoặc danh mục con nào.
          </div>
          <DialogFooter className="pt-4 border-t border-slate-100 mt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-lg h-10 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-lg h-10 bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
