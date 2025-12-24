import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import apiClient from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface ImageUploadProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = maxImages - images.length;
        if (files.length > remainingSlots) {
            toast.warning(`Chỉ có thể upload tối đa ${maxImages} ảnh. Còn ${remainingSlots} slot trống.`);
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });

            const response = await apiClient.post('/uploads/multiple?folder=products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadedUrls = response.data.data.map((file: any) => file.url);
            onChange([...images, ...uploadedUrls]);
            toast.success(`✅ Đã upload ${uploadedUrls.length} ảnh thành công!`);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`❌ Upload thất bại: ${error?.message || 'Lỗi không xác định'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
        toast.info('Đã xóa ảnh khỏi danh sách');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || images.length >= maxImages}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Đang upload...' : 'Chọn ảnh'}
                </Button>
                <span className="text-sm text-muted-foreground">
                    {images.length}/{maxImages} ảnh
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading || images.length >= maxImages}
                />
            </div>

            {images.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có ảnh nào</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Click "Chọn ảnh" để upload (tối đa {maxImages} ảnh)
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                    Ảnh chính
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Ảnh đầu tiên sẽ là ảnh chính của sản phẩm. Kéo thả để sắp xếp lại (chưa hỗ trợ).
            </p>
        </div>
    );
}
