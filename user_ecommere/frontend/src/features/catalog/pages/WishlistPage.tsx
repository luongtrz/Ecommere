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
      <div className="min-h-screen bg-slate-50 py-8 md:py-12">
        <div className="container">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-8 md:mb-10">
            <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
              <Heart className="h-5 w-5 fill-rose-600 text-rose-600" />
            </div>
            <div>
              <p className="uppercase tracking-wider text-[10px] font-semibold text-teal-600 mb-0.5">
                Yêu thích
              </p>
              <h1 className="text-2xl md:text-3xl font-sans font-bold text-slate-900 tracking-tight">
                Danh sách yêu thích ({items.length})
              </h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-16 text-center max-w-xl mx-auto shadow-sm animate-fade-in">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <Heart className="h-8 w-8 text-rose-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-900">
                Danh sách trống
              </h2>
              <p className="text-sm text-slate-600 mt-2 mb-6 max-w-sm mx-auto">
                Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.
              </p>
              <Button
                asChild
                className="rounded-lg px-8 bg-teal-600 hover:bg-teal-700 text-white focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm transition-all duration-200"
              >
                <Link to="/catalog">Khám phá sản phẩm ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
              {items.map((item) => (
                <Card
                  key={item.productId}
                  className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full bg-white rounded-xl"
                >
                  <Link
                    to={`/p/${item.slug}`}
                    className="relative overflow-hidden aspect-square block bg-slate-50 border-b border-slate-100"
                  >
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem(item.productId);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white transition-all duration-200 shadow-sm border border-slate-200"
                      aria-label="Xóa khỏi danh sách yêu thích"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="uppercase tracking-wider text-[10px] font-semibold text-teal-600 mb-1">
                        Thai Spray
                      </p>
                      <Link to={`/p/${item.slug}`}>
                        <h3 className="text-sm font-sans font-semibold line-clamp-2 text-slate-900 group-hover:text-teal-600 transition-colors mb-2 min-h-[2.5rem] leading-snug">
                          {item.name}
                        </h3>
                      </Link>
                    </div>
                    <div className="font-sans font-bold text-rose-600 text-base md:text-lg pt-2 tabular-nums">
                      {formatCurrency(item.price)}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      asChild
                      className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-9 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 transition-all duration-200 active:scale-95"
                    >
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
