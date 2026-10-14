import { SEO } from '@/lib/seo';
import { useWishlist } from '../hooks/useWishlist';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

export function WishlistPage() {
  const { items, removeItem } = useWishlist();

  return (
    <>
      <SEO title="Danh sách yêu thích" />
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="container">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-8 md:mb-12">
            <div className="w-11 h-11 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center text-primary shadow-sm">
              <Heart className="h-5 w-5 fill-accent text-primary" />
            </div>
            <div>
              <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-accent-foreground/80 mb-0.5">
                Yêu thích
              </p>
              <h1 className="text-2xl md:text-3xl font-serif font-normal text-foreground tracking-tight">
                Danh sách yêu thích ({items.length})
              </h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="section-shell p-12 md:p-16 text-center max-w-xl mx-auto shadow-luxury animate-fade-in">
              <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/60">
                <Heart className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-normal text-foreground">Danh sách trống</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
                Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.
              </p>
              <Button asChild className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-luxury transition-all duration-300">
                <Link to="/catalog">Khám phá sản phẩm ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
              {items.map((item) => (
                <Card
                  key={item.productId}
                  className="group overflow-hidden border border-black/[0.03] shadow-luxury hover:shadow-luxury-glow hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full bg-card rounded-2xl md:rounded-[1.8rem]"
                >
                  <Link to={`/p/${item.slug}`} className="relative overflow-hidden aspect-square block bg-muted/30">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem(item.productId);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-card/85 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-card transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100"
                      aria-label="Xóa khỏi danh sách yêu thích"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Link>
                  <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-accent-foreground/70 mb-1">
                        Thai Spray
                      </p>
                      <Link to={`/p/${item.slug}`}>
                        <h3 className="text-sm font-serif font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-2 min-h-[2.5rem] leading-snug">
                          {item.name}
                        </h3>
                      </Link>
                    </div>
                    <div className="font-serif font-semibold text-primary text-base md:text-lg pt-2">
                      {formatCurrency(item.price)}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 md:p-5 pt-0">
                    <Button asChild className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-10 shadow-luxury transition-all duration-300 active:scale-95">
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
