import { Link } from 'react-router-dom';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />

      <div className="min-h-[calc(100vh-8rem)] bg-background flex items-center justify-center py-12 md:py-20 px-4">
        <div className="w-full max-w-3xl">
          <div className="rounded-[2rem] border border-border/80 bg-card p-8 md:p-14 text-center shadow-luxury">
            <p className="font-serif text-7xl md:text-9xl font-bold tracking-tight text-destructive/15 select-none leading-none mb-2">
              500
            </p>

            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
              Oops! Đã có lỗi xảy ra
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn.
              Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
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
                onClick={() => window.location.reload()}
                className="h-11 rounded-full border-border/80 px-7 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>

            {/* Help Section */}
            <div className="border-t border-border/70 pt-8">
              <div className="flex items-center justify-center gap-2 text-foreground mb-2">
                <MessageCircle className="h-4 w-4 text-accent-foreground" />
                <span className="font-semibold text-sm">Cần hỗ trợ?</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
                Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi
              </p>
              <Button variant="ghost" asChild className="rounded-full text-sm font-medium text-primary hover:bg-secondary">
                <Link to="/support">
                  Liên hệ hỗ trợ
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm text-left transition-all hover:-translate-y-0.5">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mb-3 text-primary">
                  <Home className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Về trang chủ</h3>
                <p className="text-xs text-muted-foreground">Quay lại trang chủ để tiếp tục mua sắm</p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm text-left transition-all hover:-translate-y-0.5">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mb-3 text-foreground">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Tải lại trang</h3>
                <p className="text-xs text-muted-foreground">Thử tải lại trang để khắc phục lỗi</p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm text-left transition-all hover:-translate-y-0.5">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mb-3 text-accent-foreground">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Liên hệ hỗ trợ</h3>
                <p className="text-xs text-muted-foreground">Nhận trợ giúp từ đội ngũ của chúng tôi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
