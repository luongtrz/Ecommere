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
                className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-xs transition-colors hover:bg-secondary/60 ${isSelected ? 'bg-secondary text-primary font-semibold' : 'text-foreground/80'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {hasChildren ? (
                    expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                <span className="truncate flex-1 text-left">{node.name}</span>
                {node.productCount > 0 && (
                    <span className="text-[11px] text-muted-foreground shrink-0">({node.productCount})</span>
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
        <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-foreground" />
                    <span className="font-serif font-medium text-foreground text-sm tracking-tight">Bộ lọc</span>
                    {activeFilterCount > 0 && (
                        <Badge variant="default" className="h-5 px-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                            {activeFilterCount}
                        </Badge>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 px-2 rounded-full transition-colors"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Xóa
                    </Button>
                )}
            </div>

            <Separator className="bg-border/60" />

            <Accordion type="multiple" defaultValue={defaultOpenValues} className="w-full">
                {/* Category Filter */}
                {!hideCategoryFilter && categoryTree && categoryTree.length > 0 && (
                    <AccordionItem value="category" className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline text-[11px] font-bold text-foreground uppercase tracking-[0.15em]">
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
                    <AccordionTrigger className="py-3 hover:no-underline text-[11px] font-bold text-foreground uppercase tracking-[0.15em]">
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
                                        className={`w-full text-left text-xs py-2 px-2.5 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-secondary text-primary font-semibold border-l-2 border-accent'
                                            : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handlePriceApply();
                                    }
                                }}
                                className="h-8 text-xs bg-background/80 border-border/80 rounded-xl focus:bg-background focus:border-accent focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <span className="text-muted-foreground text-xs shrink-0">-</span>
                            <Input
                                type="number"
                                placeholder="Đến"
                                value={maxPriceInput}
                                onChange={(e) => setMaxPriceInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handlePriceApply();
                                    }
                                }}
                                className="h-8 text-xs bg-background/80 border-border/80 rounded-xl focus:bg-background focus:border-accent focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs shrink-0 rounded-xl border-border/80 bg-background/80 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                                onClick={handlePriceApply}
                            >
                                Áp dụng
                            </Button>
                        </div>
                        {isPriceRangeInvalid && (
                            <p className="text-xs text-destructive mt-1.5 font-medium">
                                Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa
                            </p>
                        )}
                    </AccordionContent>
                </AccordionItem>

                {/* Scent Filter */}
                {filterOptions && filterOptions.scents.length > 0 && (
                    <AccordionItem value="scent" className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline text-[11px] font-bold text-foreground uppercase tracking-[0.15em]">
                            Hương
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {filterOptions.scents.map((scentName) => {
                                    const isChecked = selectedScents.includes(scentName);
                                    return (
                                        <label
                                            key={scentName}
                                            className="flex items-center gap-2.5 cursor-pointer hover:bg-secondary/40 py-1 px-2 rounded-xl transition-colors"
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => toggleArrayFilter('scent', scentName, selectedScents)}
                                                className="h-4 w-4 rounded-md border-border/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <span className={`text-xs transition-colors ${isChecked ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
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
                        <AccordionTrigger className="py-3 hover:no-underline text-[11px] font-bold text-foreground uppercase tracking-[0.15em]">
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
                                            className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${isSelected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                                                : 'bg-card text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground'
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
                        <AccordionTrigger className="py-3 hover:no-underline text-[11px] font-bold text-foreground uppercase tracking-[0.15em]">
                            Thương hiệu
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {filterOptions.brands.map((brandName) => {
                                    const isChecked = selectedBrands.includes(brandName);
                                    return (
                                        <label
                                            key={brandName}
                                            className="flex items-center gap-2.5 cursor-pointer hover:bg-secondary/40 py-1 px-2 rounded-xl transition-colors"
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => toggleArrayFilter('brand', brandName, selectedBrands)}
                                                className="h-4 w-4 rounded-md border-border/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <span className={`text-xs transition-colors ${isChecked ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
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
                    <Separator className="mt-3 bg-border/60" />
                    <div className="py-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">Đang lọc</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {currentFilters.categorySlug && (
                                <Badge variant="secondary" className="text-[10px] h-6 px-2.5 gap-1.5 rounded-full border border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all">
                                    Danh mục: {currentFilters.categorySlug}
                                    <button onClick={() => onFilterChange({ categorySlug: undefined })} aria-label="Xóa bộ lọc danh mục" className="hover:text-destructive transition-colors ml-0.5">
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            )}
                            {(currentFilters.minPrice || currentFilters.maxPrice) && (
                                <Badge variant="secondary" className="text-[10px] h-6 px-2.5 gap-1.5 rounded-full border border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all">
                                    Giá: {currentFilters.minPrice ? formatCurrency(currentFilters.minPrice) : '0'} - {currentFilters.maxPrice ? formatCurrency(currentFilters.maxPrice) : '...'}
                                    <button onClick={() => {
                                        setMinPriceInput('');
                                        setMaxPriceInput('');
                                        onFilterChange({ minPrice: undefined, maxPrice: undefined });
                                    }} aria-label="Xóa bộ lọc giá" className="hover:text-destructive transition-colors ml-0.5">
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            )}
                            {selectedScents.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px] h-6 px-2.5 gap-1.5 rounded-full border border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all">
                                    {s}
                                    <button onClick={() => toggleArrayFilter('scent', s, selectedScents)} aria-label={`Xóa bộ lọc ${s}`} className="hover:text-destructive transition-colors ml-0.5">
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                            {selectedVolumes.map((v) => (
                                <Badge key={v} variant="secondary" className="text-[10px] h-6 px-2.5 gap-1.5 rounded-full border border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all">
                                    {v}ml
                                    <button onClick={() => toggleArrayFilter('volumeMl', v.toString(), selectedVolumes.map(String))} aria-label={`Xóa bộ lọc ${v}ml`} className="hover:text-destructive transition-colors ml-0.5">
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                            {selectedBrands.map((b) => (
                                <Badge key={b} variant="secondary" className="text-[10px] h-6 px-2.5 gap-1.5 rounded-full border border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all">
                                    {b}
                                    <button onClick={() => toggleArrayFilter('brand', b, selectedBrands)} aria-label={`Xóa bộ lọc ${b}`} className="hover:text-destructive transition-colors ml-0.5">
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
