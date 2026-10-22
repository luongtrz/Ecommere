import { Link } from 'react-router-dom';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />

      <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm text-center">
          {/* Large code */}
          <div className="mb-4">
            <span className="font-sans text-7xl font-bold tracking-tight text-rose-600 sm:text-8xl md:text-9xl">
              500
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-3">
            Oops! Đã có lỗi xảy ra
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
            Xin lỗi, chúng tôi đang gặp sự cố kỹ thuật và không thể tải trang.
            Đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. Vui lòng thử
            lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-8">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm"
              asChild
            >
              <Link to="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>

          {/* Help Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
              <MessageCircle className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Cần hỗ trợ?
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của
              chúng tôi
            </p>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              <Link to="/support">Liên hệ hỗ trợ</Link>
            </Button>
          </div>

          {/* Additional Help Cards */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/"
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-teal-50/50 hover:border-teal-200 transition-all duration-200 text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-2 text-teal-700 group-hover:scale-105 transition-transform">
                  <Home className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-slate-900 mb-1">
                  Về trang chủ
                </p>
                <p className="text-[11px] text-slate-500">
                  Quay lại trang chủ để tiếp tục mua sắm
                </p>
              </Link>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-teal-50/50 hover:border-teal-200 transition-all duration-200 text-center group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-2 text-teal-700 group-hover:scale-105 transition-transform">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-slate-900 mb-1">
                  Tải lại trang
                </p>
                <p className="text-[11px] text-slate-500">
                  Thử tải lại trang để khắc phục lỗi
                </p>
              </button>

              <Link
                to="/support"
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-teal-50/50 hover:border-teal-200 transition-all duration-200 text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-2 text-teal-700 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-slate-900 mb-1">
                  Liên hệ hỗ trợ
                </p>
                <p className="text-[11px] text-slate-500">
                  Nhận trợ giúp từ đội ngũ của chúng tôi
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
