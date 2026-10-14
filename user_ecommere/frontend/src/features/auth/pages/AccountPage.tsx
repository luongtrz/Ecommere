import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield, ShoppingBag, Heart, Settings, LogOut, MapPin, Phone, ChevronRight } from 'lucide-react';
import { SEO } from '@/lib/seo';
import { formatDate } from '@/lib/utils';
import { ProfileFormDialog } from '@/features/users/components/ProfileFormDialog';

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN'
      ? 'bg-destructive/15 text-destructive border-destructive/25'
      : 'bg-secondary text-secondary-foreground border-border';
  };

  return (
    <>
      <SEO title="Tài khoản" />
      <div className="container max-w-6xl py-12 md:py-20 min-h-screen flex flex-col space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block mb-1">
              Trung tâm tài khoản
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-normal text-foreground">
              Tài khoản của tôi
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-normal">
              Quản lý thông tin và hoạt động của bạn
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive px-4 py-2 font-medium text-xs transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 flex-1">
          {/* Left Column: Profile & Menu */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            {/* Quick Profile */}
            <Card className="rounded-2xl md:rounded-[1.8rem] border border-border/80 bg-card p-6 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-serif font-bold shadow-luxury shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-serif font-medium text-foreground truncate">{user.name}</h2>
                  <Badge variant="secondary" className={`${getRoleColor(user.role)} px-2.5 py-0.5 rounded-full text-[10px] mt-1 font-semibold tracking-wider uppercase border`}>
                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng thân thiết'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setIsProfileDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Menu */}
            <Card className="rounded-2xl md:rounded-[1.8rem] border border-border/80 bg-card shadow-luxury overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-border bg-secondary/30">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Danh mục
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                {[
                  { icon: ShoppingBag, label: 'Đơn hàng của tôi', path: '/orders' },
                  { icon: MapPin, label: 'Sổ địa chỉ', path: '/addresses' },
                  { icon: Heart, label: 'Danh sách yêu thích', path: '/wishlist' },
                  { icon: Shield, label: 'Bảo mật tài khoản', path: '#' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => item.path !== '#' && navigate(item.path)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-secondary/70 transition-all duration-200 group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-border/50">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm text-foreground transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
            <Card className="rounded-2xl md:rounded-[1.8rem] border border-border/80 bg-card shadow-luxury overflow-hidden">
              <CardHeader className="py-5 px-6 sm:px-8 border-b border-border bg-secondary/20">
                <CardTitle className="font-serif flex items-center gap-2.5 text-base sm:text-lg font-normal text-foreground">
                  <User className="h-5 w-5 text-accent-foreground" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/70 bg-background/50 hover:bg-secondary/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/50">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-sm text-foreground truncate">{user.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/70 bg-background/50 hover:bg-secondary/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/50">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Số điện thoại</p>
                      <p className="font-medium text-sm text-foreground">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/70 bg-background/50 hover:bg-secondary/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/50">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Ngày tham gia</p>
                      <p className="font-medium text-sm text-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : 'Không rõ'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/70 bg-background/50 hover:bg-secondary/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/50">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Trạng thái</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        <p className="font-medium text-sm text-foreground">Đang hoạt động</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Thống kê hoạt động
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/40 rounded-2xl p-5 text-center border border-border/60 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="font-serif text-3xl font-medium text-foreground">0</div>
                      <div className="text-xs text-muted-foreground font-normal mt-1">Đơn hàng</div>
                    </div>
                    <div className="bg-secondary/40 rounded-2xl p-5 text-center border border-border/60 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="font-serif text-3xl font-medium text-foreground">0</div>
                      <div className="text-xs text-muted-foreground font-normal mt-1">Đánh giá</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ProfileFormDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />
      </div>
    </>
  );
}
