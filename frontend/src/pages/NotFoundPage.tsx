import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';

export function NotFoundPage() {
  return (
    <>
      <SEO title="404 - Không tìm thấy trang" />
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Không tìm thấy trang</h2>
        <p className="text-muted-foreground mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
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
