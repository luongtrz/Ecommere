import { Link } from 'react-router-dom';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />

      <main className="min-h-[75vh] flex items-center justify-center section-y bg-background text-foreground">
        <div className="container max-w-2xl px-4 text-center">
          <p className="eyebrow text-destructive mb-3">Oops! Đã có lỗi xảy ra</p>
          <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Không thể tải trang
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            Xin lỗi, chúng tôi đang gặp sự cố kỹ thuật.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn.
            Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
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
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>

          {/* Help Section */}
          <div className="border-t border-border pt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-foreground mb-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-sans font-medium text-sm">Cần hỗ trợ?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/support">
                Liên hệ hỗ trợ
              </Link>
            </Button>
          </div>

          {/* Additional Help Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="surface p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Home className="h-4 w-4 text-primary" />
                <h3 className="font-sans font-semibold text-sm text-foreground">Về trang chủ</h3>
              </div>
              <p className="text-xs text-muted-foreground">Quay lại trang chủ để tiếp tục mua sắm</p>
            </div>

            <div className="surface p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCw className="h-4 w-4 text-primary" />
                <h3 className="font-sans font-semibold text-sm text-foreground">Tải lại trang</h3>
              </div>
              <p className="text-xs text-muted-foreground">Thử tải lại trang để khắc phục lỗi</p>
            </div>

            <div className="surface p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="font-sans font-semibold text-sm text-foreground">Liên hệ hỗ trợ</h3>
              </div>
              <p className="text-xs text-muted-foreground">Nhận trợ giúp từ đội ngũ của chúng tôi</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
