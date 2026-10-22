import { Link } from 'react-router-dom';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />

      <div className="min-h-[calc(100vh-8rem)] bg-slate-50 flex items-center justify-center py-10 md:py-16 px-4 font-sans">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 md:p-12 text-center shadow-sm">
            <p className="font-sans text-7xl md:text-8xl font-bold tracking-tight text-rose-200 select-none leading-none mb-3">
              500
            </p>

            <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Oops! Đã có lỗi xảy ra
            </h1>
            <p className="text-sm md:text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed font-sans">
              Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn.
              Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <Button
                size="lg"
                className="h-10 w-full sm:w-auto rounded-lg bg-teal-600 px-6 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
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
                className="h-10 w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>

            {/* Help Section */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-center gap-2 text-slate-900 mb-2">
                <MessageCircle className="h-4 w-4 text-teal-600" />
                <span className="font-semibold text-sm font-sans">
                  Cần hỗ trợ?
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto leading-relaxed font-sans">
                Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của
                chúng tôi
              </p>
              <Button
                variant="ghost"
                asChild
                className="rounded-lg text-sm font-medium text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              >
                <Link to="/support">Liên hệ hỗ trợ</Link>
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mb-2.5 text-teal-600 border border-slate-100">
                  <Home className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 mb-0.5 font-sans">
                  Về trang chủ
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Quay lại trang chủ để tiếp tục mua sắm
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mb-2.5 text-slate-700 border border-slate-100">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 mb-0.5 font-sans">
                  Tải lại trang
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Thử tải lại trang để khắc phục lỗi
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mb-2.5 text-teal-600 border border-slate-100">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 mb-0.5 font-sans">
                  Liên hệ hỗ trợ
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Nhận trợ giúp từ đội ngũ của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
