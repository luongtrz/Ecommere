import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, ShoppingBag, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <SEO title="404 - Không tìm thấy trang" />

      <main className="min-h-[75vh] flex items-center justify-center section-y bg-background text-foreground">
        <div className="container max-w-2xl px-4 text-center">
          <div className="font-serif text-7xl md:text-9xl font-semibold tracking-tight text-primary/15 select-none mb-2 tabular">
            404
          </div>
          <p className="eyebrow text-muted-foreground mb-3">Oops! Trang không tồn tại</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-3">
            Không tìm thấy trang
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            Trang bạn đang tìm kiếm có thể đã bị di chuyển hoặc không tồn tại.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
            Có thể đường dẫn không chính xác hoặc trang đã bị xóa.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <Button asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </div>

          {/* Popular Links */}
          <div className="border-t border-border pt-8 text-left">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 text-center">
              Có thể bạn đang tìm kiếm:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/catalog"
                className="surface p-4 flex items-center gap-3 transition-colors hover:border-foreground/30"
              >
                <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-sans font-medium text-sm text-foreground">Sản phẩm</div>
                  <div className="text-xs text-muted-foreground">Xem danh mục sản phẩm</div>
                </div>
              </Link>

              <Link
                to="/categories"
                className="surface p-4 flex items-center gap-3 transition-colors hover:border-foreground/30"
              >
                <Search className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-sans font-medium text-sm text-foreground">Danh mục</div>
                  <div className="text-xs text-muted-foreground">Tìm theo danh mục</div>
                </div>
              </Link>

              <Link
                to="/support"
                className="surface p-4 flex items-center gap-3 transition-colors hover:border-foreground/30"
              >
                <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-sans font-medium text-sm text-foreground">Hỗ trợ</div>
                  <div className="text-xs text-muted-foreground">Liên hệ hỗ trợ</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Tip Element */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">💡 Mẹo:</span>{' '}
              Kiểm tra lại đường dẫn URL hoặc sử dụng thanh tìm kiếm
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
