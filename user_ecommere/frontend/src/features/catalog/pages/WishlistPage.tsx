import { SEO } from '@/lib/seo';
import { useWishlist } from '../hooks/useWishlist';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Heart, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
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
          <div className="container py-6 md:py-8">
            {/* Back Link (L08-10) */}
            <div className="mb-4">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Tiếp tục mua sắm</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
              Danh sách yêu thích{' '}
              <span className="text-muted-foreground text-lg sm:text-xl font-normal tabular">
                ({items.length})
              </span>
            </h1>
          </div>
        </div>

        <div className="container py-8 md:py-12">
          {items.length === 0 ? (
            <div className="py-12 max-w-md mx-auto px-4">
              <EmptyState
                titleLevel="h2"
                icon={<Heart className="h-8 w-8 text-foreground" />}
                title="Danh sách trống"
                description="Bạn chưa lưu sản phẩm nào vào danh sách yêu thích."
                action={
                  <Button
                    asChild
                    className="w-full sm:w-auto sm:min-w-[12rem] min-h-11"
                  >
                    <Link to="/catalog">Khám phá sản phẩm</Link>
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
                  <div className="relative overflow-hidden aspect-[4/5] block bg-muted">
                    <Link
                      to={`/p/${item.slug}`}
                      className="block w-full h-full"
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 motion-reduce:transform-none group-hover:scale-[1.03]"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem(item.productId);
                      }}
                      className="absolute top-2.5 right-2.5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-destructive hover:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Xóa khỏi danh sách yêu thích"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <Link to={`/p/${item.slug}`}>
                      <h3 className="text-base font-semibold leading-snug line-clamp-2 text-foreground group-hover:underline underline-offset-4 transition-colors mb-2 min-h-[2.75rem]">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="text-base font-semibold text-foreground tabular">
                      {formatCurrency(item.price)}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-md text-sm min-h-11 h-11"
                    >
                      <Link
                        to={`/p/${item.slug}`}
                        className="inline-flex items-center justify-center"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
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
