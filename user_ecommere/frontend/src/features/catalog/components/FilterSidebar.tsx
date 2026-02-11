import { useState, useCallback, useMemo } from 'react';
import { useCategoryTree } from '../hooks/useCategories';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { ChevronDown, ChevronRight, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { CategoryTreeNode } from '../api/categories.api';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

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
                onClick={() => {
                    if (hasChildren) {
                        setExpanded(!expanded);
                    }
                    onSelect(node.slug);
                }}
                className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {hasChildren ? (
                    expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    )
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                <span className="truncate flex-1 text-left">{node.name}</span>
                {node.productCount > 0 && (
                    <span className="text-xs text-gray-400 shrink-0">({node.productCount})</span>
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

export function FilterSidebar({ currentFilters, onFilterChange, hideCategoryFilter = false }: FilterSidebarProps) {
    const { data: categoryTree } = useCategoryTree();
    const { data: filterOptions } = useFilterOptions();

    const [minPriceInput, setMinPriceInput] = useState(currentFilters.minPrice?.toString() || '');
    const [maxPriceInput, setMaxPriceInput] = useState(currentFilters.maxPrice?.toString() || '');

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

    // Dem so luong filter dang active
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

    // Handle price input apply
    const handlePriceApply = useCallback(() => {
        onFilterChange({
            minPrice: minPriceInput || undefined,
            maxPrice: maxPriceInput || undefined,
        });
    }, [minPriceInput, maxPriceInput, onFilterChange]);

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
        <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-900 text-sm">Bộ lọc</span>
                    {activeFilterCount > 0 && (
                        <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-blue-600">
                            {activeFilterCount}
                        </Badge>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="h-7 text-xs text-gray-500 hover:text-red-600 gap-1 px-2"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Xóa
                    </Button>
                )}
            </div>

            <Separator />

            <Accordion type="multiple" defaultValue={defaultOpenValues} className="w-full">
                {/* Category Filter */}
                {!hideCategoryFilter && categoryTree && categoryTree.length > 0 && (
                    <AccordionItem value="category" className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Danh mục
                        </AccordionTrigger>
                        <AccordionContent>
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
                <AccordionItem value="price" className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Khoảng giá
                    </AccordionTrigger>
                    <AccordionContent>
                        {/* Preset ranges */}
                        <div className="space-y-1.5 mb-3">
                            {PRICE_RANGES.map((range, idx) => {
                                const isActive = currentFilters.minPrice === range.min &&
                                    (range.max === undefined ? !currentFilters.maxPrice : currentFilters.maxPrice === range.max);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handlePricePreset(range.min, range.max)}
                                        className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom price range */}
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                placeholder="Từ"
                                value={minPriceInput}
                                onChange={(e) => setMinPriceInput(e.target.value)}
                                className="h-8 text-xs"
                            />
                            <span className="text-gray-400 text-xs shrink-0">-</span>
                            <Input
                                type="number"
                                placeholder="Đến"
                                value={maxPriceInput}
                                onChange={(e) => setMaxPriceInput(e.target.value)}
                                className="h-8 text-xs"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs shrink-0"
                                onClick={handlePriceApply}
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Scent Filter */}
                {filterOptions && filterOptions.scents.length > 0 && (
                    <AccordionItem value="scent" className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Hương
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filterOptions.scents.map((scentName) => {
                                    const isChecked = selectedScents.includes(scentName);
                                    return (
                                        <label
                                            key={scentName}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-0.5 px-1 rounded"
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => toggleArrayFilter('scent', scentName, selectedScents)}
                                                className="h-3.5 w-3.5"
                                            />
                                            <span className={`text-xs ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
                    <AccordionItem value="volume" className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Dung tích
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="flex flex-wrap gap-1.5">
                                {filterOptions.volumes.map((vol) => {
                                    const isSelected = selectedVolumes.includes(vol);
                                    return (
                                        <button
                                            key={vol}
                                            onClick={() => toggleArrayFilter('volumeMl', vol.toString(), selectedVolumes.map(String))}
                                            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
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
                    <AccordionItem value="brand" className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Thương hiệu
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filterOptions.brands.map((brandName) => {
                                    const isChecked = selectedBrands.includes(brandName);
                                    return (
                                        <label
                                            key={brandName}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-0.5 px-1 rounded"
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => toggleArrayFilter('brand', brandName, selectedBrands)}
                                                className="h-3.5 w-3.5"
                                            />
                                            <span className={`text-xs ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
            {activeFilterCount > 0 && (
                <>
                    <Separator className="mt-2" />
                    <div className="py-3">
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">Đang lọc</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {currentFilters.categorySlug && (
                                <Badge variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
                                    Danh mục: {currentFilters.categorySlug}
                                    <button onClick={() => onFilterChange({ categorySlug: undefined })}>
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            )}
                            {(currentFilters.minPrice || currentFilters.maxPrice) && (
                                <Badge variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
                                    Giá: {currentFilters.minPrice ? formatCurrency(currentFilters.minPrice) : '0'} - {currentFilters.maxPrice ? formatCurrency(currentFilters.maxPrice) : '...'}
                                    <button onClick={() => {
                                        setMinPriceInput('');
                                        setMaxPriceInput('');
                                        onFilterChange({ minPrice: undefined, maxPrice: undefined });
                                    }}>
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            )}
                            {selectedScents.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
                                    {s}
                                    <button onClick={() => toggleArrayFilter('scent', s, selectedScents)}>
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                            {selectedVolumes.map((v) => (
                                <Badge key={v} variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
                                    {v}ml
                                    <button onClick={() => toggleArrayFilter('volumeMl', v.toString(), selectedVolumes.map(String))}>
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                            {selectedBrands.map((b) => (
                                <Badge key={b} variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
                                    {b}
                                    <button onClick={() => toggleArrayFilter('brand', b, selectedBrands)}>
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
