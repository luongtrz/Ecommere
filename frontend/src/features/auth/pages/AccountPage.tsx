import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Tài khoản của tôi</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                  <p className="font-medium">
                    {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={logout}>
                Đăng xuất
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
