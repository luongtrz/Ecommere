import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, ShoppingBag, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <SEO title="404 - Không tìm thấy trang" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 via-blue-600 to-gray-800 text-white">
          <div className="container py-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Không tìm thấy trang</h1>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto">
                Trang bạn đang tìm kiếm có thể đã bị di chuyển hoặc không tồn tại
              </p>
            </div>
          </div>
        </div>

        <div className="container py-16 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl font-bold text-white">404</span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Oops! Trang không tồn tại</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
              Có thể đường dẫn không chính xác hoặc trang đã bị xóa.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                asChild
              >
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Về trang chủ
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Quay lại
              </Button>
            </div>

            {/* Popular Links */}
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Có thể bạn đang tìm kiếm:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/catalog"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Sản phẩm</div>
                    <div className="text-sm text-gray-600">Xem danh mục sản phẩm</div>
                  </div>
                </Link>

                <Link
                  to="/categories"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Search className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Danh mục</div>
                    <div className="text-sm text-gray-600">Tìm theo danh mục</div>
                  </div>
                </Link>

                <Link
                  to="/support"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Hỗ trợ</div>
                    <div className="text-sm text-gray-600">Liên hệ hỗ trợ</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Fun Element */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-sm">
              <span className="text-sm text-gray-600">💡 Mẹo:</span>
              <span className="text-sm font-medium text-gray-900">
                Kiểm tra lại đường dẫn URL hoặc sử dụng thanh tìm kiếm
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
