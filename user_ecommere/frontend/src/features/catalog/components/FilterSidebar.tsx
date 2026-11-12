import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCategoryTree } from '../hooks/useCategories';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import type { CategoryTreeNode } from '../api/categories.api';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FilterSidebarProps {
    currentFilters: {
        categorySlug?: string;
        minPrice?: number;
        maxPrice?: number;
        scent?: string;
        volumeMl?: string;
        brand?: string;
    };
    onFilterChange: (filters: Record<string, string | undefined>) => void;
    hideCategoryFilter?: boolean;
    hideHeader?: boolean;
    hideActiveFilters?: boolean;
}

function findCategoryName(tree: CategoryTreeNode[] | undefined, slug: string | undefined): string | undefined {
    if (!tree || !slug) return undefined;
    for (const node of tree) {
        if (node.slug === slug) return node.name;
        if (node.children && node.children.length > 0) {
            const found = findCategoryName(node.children, slug);
            if (found) return found;
        }
    }
    return undefined;
}

// Component hien thi 1 category va children cua no
function CategoryTreeItem({
    node,
    selectedSlug,
    onSelect,
    depth = 0,
}: {
    node: CategoryTreeNode;
    selectedSlug?: string;
    onSelect: (slug: string) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(depth === 0);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedSlug === node.slug;

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    if (hasChildren) {
                        setExpanded(!expanded);
                    }
                    onSelect(node.slug);
                }}
                className={`w-full flex items-center gap-2 min-h-11 py-2.5 px-2 rounded-md text-sm transition-colors hover:bg-secondary/40 ${isSelected ? 'bg-secondary text-primary font-semibold' : 'text-foreground/80'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {hasChildren ? (
                    expanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )
                ) : (
                    <span className="w-4 shrink-0" />
                )}
                <span className="truncate flex-1 text-left">{node.name}</span>
                {node.productCount > 0 && (
                    <span className="text-xs text-muted-foreground tabular shrink-0">({node.productCount})</span>
                )}
            </button>
            {hasChildren && expanded && (
                <div>
                    {node.children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            node={child}
                            selectedSlug={selectedSlug}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Cac khoang gia preset
const PRICE_RANGES = [
    { label: 'Dưới 50.000đ', min: 0, max: 50000 },
    { label: '50.000đ - 100.000đ', min: 50000, max: 100000 },
    { label: '100.000đ - 200.000đ', min: 100000, max: 200000 },
    { label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
    { label: 'Trên 500.000đ', min: 500000, max: undefined },
];

export function FilterSidebar({
    currentFilters,
    onFilterChange,
    hideCategoryFilter = false,
    hideHeader = false,
    hideActiveFilters = false,
}: FilterSidebarProps) {
    const { data: categoryTree } = useCategoryTree();
    const { data: filterOptions } = useFilterOptions();

    const [minPriceInput, setMinPriceInput] = useState(currentFilters.minPrice?.toString() || '');
    const [maxPriceInput, setMaxPriceInput] = useState(currentFilters.maxPrice?.toString() || '');

    useEffect(() => {
        setMinPriceInput(currentFilters.minPrice !== undefined ? currentFilters.minPrice.toString() : '');
    }, [currentFilters.minPrice]);

    useEffect(() => {
        setMaxPriceInput(currentFilters.maxPrice !== undefined ? currentFilters.maxPrice.toString() : '');
    }, [currentFilters.maxPrice]);

    const activeCategoryName = useMemo(() => {
        return findCategoryName(categoryTree, currentFilters.categorySlug);
    }, [categoryTree, currentFilters.categorySlug]);

    // Parse selected values tu comma-separated string
    const selectedScents = useMemo(() => {
        if (!currentFilters.scent) return [] as string[];
        return currentFilters.scent.split(',').map(s => s.trim()).filter(Boolean);
    }, [currentFilters.scent]);

    const selectedVolumes = useMemo(() => {
        if (!currentFilters.volumeMl) return [] as number[];
        return currentFilters.volumeMl.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
    }, [currentFilters.volumeMl]);

    const selectedBrands = useMemo(() => {
        if (!currentFilters.brand) return [] as string[];
        return currentFilters.brand.split(',').map(b => b.trim()).filter(Boolean);
    }, [currentFilters.brand]);

    // Đếm số lượng filter đang active
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (currentFilters.categorySlug) count++;
        if (currentFilters.minPrice || currentFilters.maxPrice) count++;
        if (selectedScents.length > 0) count++;
        if (selectedVolumes.length > 0) count++;
        if (selectedBrands.length > 0) count++;
        return count;
    }, [currentFilters, selectedScents, selectedVolumes, selectedBrands]);

    // Toggle 1 gia tri trong danh sach
    const toggleArrayFilter = useCallback((key: string, value: string, currentValues: string[]) => {
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange({ [key]: newValues.length > 0 ? newValues.join(',') : undefined });
    }, [onFilterChange]);

    // Handle category select
    const handleCategorySelect = useCallback((slug: string) => {
        if (currentFilters.categorySlug === slug) {
            onFilterChange({ categorySlug: undefined });
        } else {
            onFilterChange({ categorySlug: slug });
        }
    }, [currentFilters.categorySlug, onFilterChange]);

    // Handle price range preset
    const handlePricePreset = useCallback((min: number, max: number | undefined) => {
        setMinPriceInput(min.toString());
        setMaxPriceInput(max?.toString() || '');
        onFilterChange({
            minPrice: min.toString(),
            maxPrice: max?.toString() || undefined,
        });
    }, [onFilterChange]);

    const isPriceRangeInvalid = useMemo(() => {
        const minStr = minPriceInput.trim();
        const maxStr = maxPriceInput.trim();
        if (minStr === '' || maxStr === '') return false;
        const min = Number(minStr);
        const max = Number(maxStr);
        return !isNaN(min) && !isNaN(max) && min > max;
    }, [minPriceInput, maxPriceInput]);

    // Handle price input apply
    const handlePriceApply = useCallback(() => {
        if (isPriceRangeInvalid) return;
        onFilterChange({
            minPrice: minPriceInput.trim() || undefined,
            maxPrice: maxPriceInput.trim() || undefined,
        });
    }, [isPriceRangeInvalid, minPriceInput, maxPriceInput, onFilterChange]);

    // Clear all filters
    const handleClearAll = useCallback(() => {
        setMinPriceInput('');
        setMaxPriceInput('');
        onFilterChange({
            categorySlug: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            scent: undefined,
            volumeMl: undefined,
            brand: undefined,
        });
    }, [onFilterChange]);

    // Default open values for accordion
    const defaultOpenValues = ['category', 'price', 'scent', 'volume', 'brand'];

    return (
        <div className="space-y-0">
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-foreground" />
                        <span className="font-semibold text-foreground text-sm">Bộ lọc</span>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-sm font-normal tabular">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </div>
                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </div>
            )}

            <Accordion type="multiple" defaultValue={defaultOpenValues} className="w-full">
                {/* Category Filter */}
                {!hideCategoryFilter && categoryTree && categoryTree.length > 0 && (
                    <AccordionItem value="category" className="border-b border-border py-5">
                        <AccordionTrigger className="min-h-11 py-2.5 mb-2 hover:no-underline text-sm font-semibold text-foreground">
                            Danh mục
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-0">
                            <div className="space-y-0.5 max-h-60 overflow-y-auto pl-1">
                                {categoryTree.map((node) => (
                                    <CategoryTreeItem
                                        key={node.id}
                                        node={node}
                                        selectedSlug={currentFilters.categorySlug}
                                        onSelect={handleCategorySelect}
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Price Range Filter */}
                <AccordionItem value="price" className="border-b border-border py-5">
                    <AccordionTrigger className="min-h-11 py-2.5 mb-2 hover:no-underline text-sm font-semibold text-foreground">
                        Khoảng giá
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-0">
                        {/* Preset ranges */}
                        <div className="space-y-1 mb-4">
                            {PRICE_RANGES.map((range, idx) => {
                                const isActive = currentFilters.minPrice === range.min &&
                                    (range.max === undefined ? !currentFilters.maxPrice : currentFilters.maxPrice === range.max);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handlePricePreset(range.min, range.max)}
                                        className={`w-full text-left text-sm min-h-11 py-2.5 px-3 rounded-md transition-colors ${isActive
                                            ? 'bg-secondary text-primary font-semibold'
                                            : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom price range */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Từ giá"
                                        value={minPriceInput}
                                        onChange={(e) => setMinPriceInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handlePriceApply();
                                            }
                                        }}
                                        className="h-11 pr-7 text-sm tabular rounded-md"
                                        aria-label="Giá tối thiểu"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                                        đ
                                    </span>
                                </div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Đến giá"
                                        value={maxPriceInput}
                                        onChange={(e) => setMaxPriceInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handlePriceApply();
                                            }
                                        }}
                                        className="h-11 pr-7 text-sm tabular rounded-md"
                                        aria-label="Giá tối đa"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                                        đ
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full h-11 text-sm rounded-md font-medium"
                                onClick={handlePriceApply}
                            >
                                Áp dụng
                            </Button>
                        </div>
                        {isPriceRangeInvalid && (
                            <p className="text-xs text-destructive mt-1.5">
                                Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa
                            </p>
                        )}
                    </AccordionContent>
                </AccordionItem>

                {/* Scent Filter */}
                {filterOptions && filterOptions.scents.length > 0 && (
                    <AccordionItem value="scent" className="border-b border-border py-5">
                        <AccordionTrigger className="min-h-11 py-2.5 mb-2 hover:no-underline text-sm font-semibold text-foreground">
                            Hương
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-0">
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {filterOptions.scents.map((scentName) => {
                                    const isChecked = selectedScents.includes(scentName);
                                    return (
                                        <label
                                            key={scentName}
                                            className="flex items-center gap-2.5 cursor-pointer hover:bg-secondary/40 min-h-11 py-2.5 px-2 rounded-md transition-colors"
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => toggleArrayFilter('scent', scentName, selectedScents)}
                                                className="rounded-sm"
                                            />
                                            <span className={`text-sm ${isChecked ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                {scentName}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Volume Filter */}
                {filterOptions && filterOptions.volumes.length > 0 && (
                    <AccordionItem value="volume" className="border-b border-border py-5">
                        <AccordionTrigger className="min-h-11 py-2.5 mb-2 hover:no-underline text-sm font-semibold text-foreground">
                            Dung tích
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-0">
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.volumes.map((vol) => {
                                    const isSelected = selectedVolumes.includes(vol);
                                    return (
                                        <button
                                            key={vol}
                                            type="button"
                                            onClick={() => toggleArrayFilter('volumeMl', vol.toString(), selectedVolumes.map(String))}
                                            className={`min-h-11 min-w-11 px-3.5 py-2 rounded-full text-sm border tabular transition-colors inline-flex items-center justify-center ${isSelected
                                                ? 'bg-primary text-primary-foreground border-primary font-medium'
                                                : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                                                }`}
                                        >
                                            {vol}ml
                                        </button>
                                    );
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Brand Filter */}
                {filterOptions && filterOptions.brands.length > 0 && (
                    <AccordionItem value="brand" className="border-b border-border py-5">
                        <AccordionTrigger className="min-h-11 py-2.5 mb-2 hover:no-underline text-sm font-semibold text-foreground">
                            Thương hiệu
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-0">
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {filterOptions.brands.map((brandName) => {
                                    const isChecked = selectedBrands.includes(brandName);
                                    return (
                                        <label
                                            key={brandName}
                                            className="flex items-center gap-2.5 cursor-pointer hover:bg-secondary/40 min-h-11 py-2.5 px-2 rounded-md transition-colors"
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => toggleArrayFilter('brand', brandName, selectedBrands)}
                                                className="rounded-sm"
                                            />
                                            <span className={`text-sm ${isChecked ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                {brandName}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>

            {/* Active Filters Tags */}
            {!hideActiveFilters && activeFilterCount > 0 && (
                <div className="pt-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Đang lọc</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {currentFilters.categorySlug && (
                            <Badge variant="secondary" className="text-xs rounded-sm gap-1.5 pr-1 font-normal">
                                Danh mục: {activeCategoryName || currentFilters.categorySlug}
                                <button
                                    type="button"
                                    onClick={() => onFilterChange({ categorySlug: undefined })}
                                    className="hover:text-foreground transition-colors p-0.5"
                                    aria-label="Xóa bộ lọc danh mục"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {(currentFilters.minPrice || currentFilters.maxPrice) && (
                            <Badge variant="secondary" className="text-xs rounded-sm gap-1.5 pr-1 font-normal tabular">
                                Giá: {currentFilters.minPrice ? formatCurrency(currentFilters.minPrice) : '0'} - {currentFilters.maxPrice ? formatCurrency(currentFilters.maxPrice) : '...'}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMinPriceInput('');
                                        setMaxPriceInput('');
                                        onFilterChange({ minPrice: undefined, maxPrice: undefined });
                                    }}
                                    className="hover:text-foreground transition-colors p-0.5"
                                    aria-label="Xóa bộ lọc giá"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {selectedScents.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs rounded-sm gap-1.5 pr-1 font-normal">
                                {s}
                                <button
                                    type="button"
                                    onClick={() => toggleArrayFilter('scent', s, selectedScents)}
                                    className="hover:text-foreground transition-colors p-0.5"
                                    aria-label={`Xóa bộ lọc hương ${s}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        {selectedVolumes.map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs rounded-sm gap-1.5 pr-1 font-normal tabular">
                                {v}ml
                                <button
                                    type="button"
                                    onClick={() => toggleArrayFilter('volumeMl', v.toString(), selectedVolumes.map(String))}
                                    className="hover:text-foreground transition-colors p-0.5"
                                    aria-label={`Xóa bộ lọc dung tích ${v}ml`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        {selectedBrands.map((b) => (
                            <Badge key={b} variant="secondary" className="text-xs rounded-sm gap-1.5 pr-1 font-normal">
                                {b}
                                <button
                                    type="button"
                                    onClick={() => toggleArrayFilter('brand', b, selectedBrands)}
                                    className="hover:text-foreground transition-colors p-0.5"
                                    aria-label={`Xóa bộ lọc thương hiệu ${b}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
