import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, ShoppingBag, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <SEO title="404 - Không tìm thấy trang" />

      <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm text-center">
          {/* Large code */}
          <div className="mb-4">
            <span className="font-sans text-7xl font-bold tracking-tight text-teal-600 sm:text-8xl md:text-9xl">
              404
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-3">
            Không tìm thấy trang
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
            Trang bạn đang tìm kiếm có thể đã bị di chuyển hoặc không tồn tại. Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Có thể đường dẫn không chính xác hoặc trang đã bị xóa.
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
              onClick={() => window.history.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </div>

          {/* Popular Links */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Có thể bạn đang tìm kiếm:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/catalog"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-200 transition-all duration-200 text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-700 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">Sản phẩm</div>
                  <div className="text-[11px] text-slate-500 truncate">Xem danh mục sản phẩm</div>
                </div>
              </Link>

              <Link
                to="/categories"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-200 transition-all duration-200 text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-700 group-hover:scale-105 transition-transform">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">Danh mục</div>
                  <div className="text-[11px] text-slate-500 truncate">Tìm theo danh mục</div>
                </div>
              </Link>

              <Link
                to="/support"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-200 transition-all duration-200 text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-700 group-hover:scale-105 transition-transform">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">Hỗ trợ</div>
                  <div className="text-[11px] text-slate-500 truncate">Liên hệ hỗ trợ</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Tip Element */}
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
              <span className="text-[11px] font-semibold text-slate-700">Mẹo:</span>
              <span className="text-[11px] text-slate-500">
                Kiểm tra lại đường dẫn URL hoặc sử dụng thanh tìm kiếm
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
