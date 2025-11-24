import { Link } from 'react-router-dom';
import { AlertCircle, Home, RefreshCw, MessageCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-800 text-white">
          <div className="container py-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Oops! Đã có lỗi xảy ra</h1>
              <p className="text-xl text-red-100 max-w-2xl mx-auto">
                Xin lỗi, chúng tôi đang gặp sự cố kỹ thuật
              </p>
            </div>
          </div>
        </div>

        <div className="container py-16 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải trang</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn.
              Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
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
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Thử lại
              </Button>
            </div>

            {/* Help Section */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">Cần hỗ trợ?</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi
              </p>
              <Button variant="ghost" asChild>
                <Link to="/support" className="text-blue-600 hover:text-blue-700">
                  Liên hệ hỗ trợ
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Về trang chủ</h3>
                <p className="text-sm text-gray-600">Quay lại trang chủ để tiếp tục mua sắm</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tải lại trang</h3>
                <p className="text-sm text-gray-600">Thử tải lại trang để khắc phục lỗi</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Liên hệ hỗ trợ</h3>
                <p className="text-sm text-gray-600">Nhận trợ giúp từ đội ngũ của chúng tôi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
