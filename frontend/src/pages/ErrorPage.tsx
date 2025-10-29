import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { SEO } from '@/lib/seo';

export function ErrorPage() {
  return (
    <>
      <SEO title="Lỗi - Đã có lỗi xảy ra" />
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-4">Đã có lỗi xảy ra</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Về trang chủ
        </Link>
      </div>
    </>
  );
}
