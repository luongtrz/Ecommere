import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit, Trash, FolderTree, FileText } from 'lucide-react';
import { Category, categoriesApi } from '@/features/admin/api/categories.api';
import { Button } from '@/components/ui/button';

interface CategoryTreeNodeProps {
    category: Category;
    level: number;
    onAddChild: (parentId: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

function CategoryTreeNode({ category, level, onAddChild, onEdit, onDelete }: CategoryTreeNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = category.children && category.children.length > 0;

    return (
        <div className="border-l-2 border-gray-200">
            <div
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                style={{ marginLeft: `${level * 20}px` }}
            >
                {hasChildren ? (
                    <button onClick={() => setExpanded(!expanded)} className="p-1">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                ) : (
                    <div className="w-6" />
                )}

                {category.isLeaf ? (
                    <FileText className="h-4 w-4 text-blue-600" />
                ) : (
                    <FolderTree className="h-4 w-4 text-amber-600" />
                )}

                <div className="flex-1">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                        ({category.productCount || 0} products)
                    </span>
                    {!category.isLeaf && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded ml-2">
                            Parent
                        </span>
                    )}
                </div>

                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onAddChild(category.id)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(category.id)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(category.id)}
                        disabled={hasChildren || (category.productCount !== undefined && category.productCount > 0)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {expanded && hasChildren && (
                <div className="ml-4">
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTree = async () => {
        try {
            setLoading(true);
            const data = await categoriesApi.getTree();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories tree:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTree();
    }, []);

    const handleAddChild = (parentId: string | null) => {
        const name = prompt('Enter category name:');
        if (!name) return;

        categoriesApi.create({ name, parentId: parentId || undefined })
            .then(() => fetchTree())
            .catch((error) => alert('Failed to create category: ' + error.message));
    };

    const handleEdit = async (id: string) => {
        const name = prompt('Enter new category name:');
        if (!name) return;

        try {
            await categoriesApi.update(id, { name });
            await fetchTree();
        } catch (error: any) {
            alert('Failed to update category: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoriesApi.delete(id);
            await fetchTree();
        } catch (error: any) {
            alert('Failed to delete category: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading categories...</div>;
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Categories</h2>
                <Button onClick={() => handleAddChild(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Root Category
                </Button>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No categories yet. Create one to get started.
                </div>
            ) : (
                categories.map((category) => (
                    <CategoryTreeNode
                        key={category.id}
                        category={category}
                        level={0}
                        onAddChild={handleAddChild}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    );
}
