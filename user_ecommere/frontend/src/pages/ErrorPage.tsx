import { Link } from 'react-router-dom';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />

      <main className="min-h-[70vh] flex items-center justify-center py-8 md:py-16 bg-background text-foreground">
        <div className="container max-w-2xl px-4 text-center">
          <p className="eyebrow text-destructive mb-3">
            Rất tiếc, đã có sự cố xảy ra
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground mb-4">
            Không thể tải trang
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            Xin lỗi, chúng tôi đang gặp sự cố kỹ thuật.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. Vui lòng thử
            lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center mb-10">
            <Button
              className="h-11 min-h-11 w-full sm:w-auto px-6 text-sm font-medium"
              asChild
            >
              <Link to="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-11 min-h-11 w-full sm:w-auto px-6 text-sm font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>

          {/* Help Section */}
          <div className="border-t border-border pt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-foreground mb-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Cần hỗ trợ?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của
              chúng tôi
            </p>
            <Button
              variant="outline"
              className="h-11 min-h-11 px-6 text-sm font-medium"
              asChild
            >
              <Link to="/chat" className="flex items-center justify-center">
                Liên hệ hỗ trợ
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
