import { SEO } from '@/lib/seo';
import { useWishlist } from '../hooks/useWishlist';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

export function WishlistPage() {
    const { items, removeItem } = useWishlist();

    return (
        <>
            <SEO title="Danh sách yêu thích" />
            <div className="min-h-screen bg-background">
                {/* Page Header */}
                <div className="border-b border-border bg-card">
                    <div className="container py-8 md:py-10">
                        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                            Danh sách yêu thích <span className="text-muted-foreground font-sans text-xl md:text-2xl font-normal tabular">({items.length})</span>
                        </h1>
                    </div>
                </div>

                <div className="container py-8 md:py-12">
                    {items.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={<Heart className="h-12 w-12 text-muted-foreground stroke-1" />}
                                title="Danh sách trống"
                                description="Bạn chưa lưu sản phẩm nào vào danh sách yêu thích."
                                action={
                                    <Button asChild className="rounded-md">
                                        <Link to="/catalog">Khám phá sản phẩm ngay</Link>
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {items.map((item) => (
                                <Card
                                    key={item.productId}
                                    className="group overflow-hidden border border-border bg-card rounded-lg flex flex-col h-full hover:border-foreground/30 transition-colors shadow-none"
                                >
                                    <div className="relative overflow-hidden aspect-square block bg-secondary">
                                        <Link to={`/p/${item.slug}`} className="block w-full h-full">
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeItem(item.productId);
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label="Xóa khỏi danh sách yêu thích"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                        <Link to={`/p/${item.slug}`}>
                                            <h3 className="text-sm font-semibold line-clamp-2 text-foreground group-hover:underline underline-offset-4 transition-colors mb-2 min-h-[2.5rem]">
                                                {item.name}
                                            </h3>
                                        </Link>
                                        <div className="font-semibold text-foreground tabular">
                                            {formatCurrency(item.price)}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0">
                                        <Button asChild variant="outline" size="sm" className="w-full rounded-md text-xs h-9">
                                            <Link to={`/p/${item.slug}`}>
                                                <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                                                Xem chi tiết
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
