import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, ShoppingBag, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <SEO title="404 - Không tìm thấy trang" />

      <div className="min-h-[calc(100vh-8rem)] bg-background flex items-center justify-center py-12 md:py-20 px-4">
        <div className="w-full max-w-3xl">
          <div className="rounded-[2rem] border border-border/80 bg-card p-8 md:p-14 text-center shadow-luxury">
            <p className="font-serif text-7xl md:text-9xl font-bold tracking-tight text-primary/10 select-none leading-none mb-2">
              404
            </p>

            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
              Không tìm thấy trang
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
              Có thể đường dẫn không chính xác hoặc trang đã bị xóa.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-10">
              <Button
                size="lg"
                className="h-11 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-luxury hover:bg-primary/95"
                asChild
              >
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="h-11 rounded-full border-border/80 px-7 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </div>

            {/* Popular Links */}
            <div className="border-t border-border/70 pt-8">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5 text-center">
                Có thể bạn đang tìm kiếm:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <Link
                  to="/catalog"
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 transition-all hover:-translate-y-0.5 text-left"
                >
                  <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shrink-0 border border-border/60 text-primary shadow-sm">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Sản phẩm</div>
                    <div className="text-xs text-muted-foreground">Xem danh mục sản phẩm</div>
                  </div>
                </Link>

                <Link
                  to="/categories"
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 transition-all hover:-translate-y-0.5 text-left"
                >
                  <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shrink-0 border border-border/60 text-accent-foreground shadow-sm">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Danh mục</div>
                    <div className="text-xs text-muted-foreground">Tìm theo danh mục</div>
                  </div>
                </Link>

                <Link
                  to="/support"
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 transition-all hover:-translate-y-0.5 text-left"
                >
                  <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shrink-0 border border-border/60 text-foreground shadow-sm">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Hỗ trợ</div>
                    <div className="text-xs text-muted-foreground">Liên hệ hỗ trợ</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Tip Element without emoji */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-card border border-border/80 rounded-full px-5 py-2 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground">Mẹo:</span>
              <span className="text-xs text-muted-foreground font-medium">
                Kiểm tra lại đường dẫn URL hoặc sử dụng thanh tìm kiếm
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
