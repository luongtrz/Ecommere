import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, ShoppingBag, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <SEO title="404 - Không tìm thấy trang" />

      <div className="min-h-[calc(100vh-8rem)] bg-slate-50 flex items-center justify-center py-10 md:py-16 px-4 font-sans">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 md:p-12 text-center shadow-sm">
            <p className="font-sans text-7xl md:text-8xl font-bold tracking-tight text-slate-200 select-none leading-none mb-3">
              404
            </p>

            <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Không tìm thấy trang
            </h1>
            <p className="text-sm md:text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed font-sans">
              Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
              Có thể đường dẫn không chính xác hoặc trang đã bị xóa.
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
                onClick={() => window.history.back()}
                className="h-10 w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </div>

            {/* Popular Links */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center font-sans">
                Có thể bạn đang tìm kiếm:
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  to="/catalog"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50/50 hover:border-teal-200 transition-all hover:-translate-y-0.5 text-left"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200 text-teal-600 shadow-sm">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 font-sans">Sản phẩm</div>
                    <div className="text-xs text-slate-500 font-sans">Xem danh mục sản phẩm</div>
                  </div>
                </Link>

                <Link
                  to="/categories"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50/50 hover:border-teal-200 transition-all hover:-translate-y-0.5 text-left"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200 text-teal-600 shadow-sm">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 font-sans">Danh mục</div>
                    <div className="text-xs text-slate-500 font-sans">Tìm theo danh mục</div>
                  </div>
                </Link>

                <Link
                  to="/support"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50/50 hover:border-teal-200 transition-all hover:-translate-y-0.5 text-left"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200 text-teal-600 shadow-sm">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 font-sans">Hỗ trợ</div>
                    <div className="text-xs text-slate-500 font-sans">Liên hệ hỗ trợ</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Tip Element without emoji */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
              <span className="text-xs font-bold text-teal-600 font-sans">Mẹo:</span>
              <span className="text-xs text-slate-600 font-medium font-sans">
                Kiểm tra lại đường dẫn URL hoặc sử dụng thanh tìm kiếm
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
