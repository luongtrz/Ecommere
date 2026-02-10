import { SEO } from '@/lib/seo';
import { useWishlist } from '../hooks/useWishlist';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

export function WishlistPage() {
    const { items, removeItem } = useWishlist();

    return (
        <>
            <SEO title="Danh sách yêu thích" />
            <div className="min-h-screen bg-gray-50/50 py-12">
                <div className="container">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                            <Heart className="h-6 w-6 fill-rose-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Danh sách yêu thích ({items.length})</h1>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="h-10 w-10 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Danh sách trống</h2>
                            <p className="text-gray-500 mt-2 mb-6">Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.</p>
                            <Button asChild className="rounded-full px-6">
                                <Link to="/catalog">Khám phá sản phẩm ngay</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <Card key={item.productId} className="group overflow-hidden border-0 shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full bg-white rounded-2xl">
                                    <Link to={`/p/${item.slug}`} className="relative overflow-hidden aspect-square block bg-gray-50">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeItem(item.productId);
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </Link>
                                    <CardContent className="p-4 flex-1">
                                        <Link to={`/p/${item.slug}`}>
                                            <h3 className="text-sm font-semibold line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors mb-2 min-h-[2.5rem]">
                                                {item.name}
                                            </h3>
                                        </Link>
                                        <div className="font-bold text-blue-600">{formatCurrency(item.price)}</div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0">
                                        <Button asChild className="w-full rounded-xl bg-gray-900 hover:bg-black text-xs h-9">
                                            <Link to={`/p/${item.slug}`}>
                                                <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                                                Xem chi tiết
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
