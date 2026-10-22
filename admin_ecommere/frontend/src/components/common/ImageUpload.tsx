import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon, GripVertical } from 'lucide-react';
import apiClient from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Ảnh vượt quá 5MB');
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (validFiles.length > remainingSlots) {
      toast.warning(
        `Chỉ có thể upload tối đa ${maxImages} ảnh. Còn ${remainingSlots} slot trống.`,
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post(
        '/uploads/multiple?folder=products',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

            const uploadedUrls = response.data.data.map((file: any) => file.url);
            onChange([...images, ...uploadedUrls]);
            toast.success(`Đã upload ${uploadedUrls.length} ảnh thành công!`);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Upload thất bại: ${error?.message || 'Lỗi không xác định'}`);
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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    // Remove from old position
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(index, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || images.length >= maxImages}
                    className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg"
                >
                    <Upload className="mr-2 h-4 w-4 text-teal-600" />
                    {isUploading ? 'Đang upload...' : 'Chọn ảnh'}
                </Button>
                <span className="text-xs text-slate-500 tabular-nums font-mono">
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
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/60 hover:bg-teal-50/30 rounded-xl p-8 text-center cursor-pointer transition-colors"
                >
                    <ImageIcon className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-900">Chưa có ảnh nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Click "Chọn ảnh" để upload (tối đa {maxImages} ảnh)
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                        {images.map((url, index) => (
                            <div
                                key={`${url}-${index}`}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-move transition-all ${
                                    draggedIndex === index ? 'opacity-40 scale-95 border-teal-500' : 'hover:border-slate-300 hover:shadow-sm'
                                }`}
                            >
                                {/* Drag handle */}
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10 border border-slate-200 shadow-sm">
                                    <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                                </div>

                                <img
                                    src={url}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                />

                                {/* Delete button */}
                                <Button
                                    type="button"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 rounded-md bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onClick={() => removeImage(index)}
                                    aria-label={`Xóa ảnh ${index + 1}`}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>

                                {/* Primary image badge */}
                                {index === 0 && (
                                    <div className="absolute bottom-2 left-2 bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">
                                        Ảnh chính
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {images.length < maxImages && (
                        <div
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className="border border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/60 hover:bg-teal-50/30 rounded-xl p-3 text-center cursor-pointer transition-colors"
                        >
                            <p className="text-xs text-slate-500">
                                Nhấn để thêm ảnh khác ({images.length}/{maxImages})
                            </p>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <GripVertical className="h-3.5 w-3.5 inline shrink-0 text-slate-400" />
                <span>Kéo thả ảnh để sắp xếp lại thứ tự. Ảnh đầu tiên sẽ là ảnh chính của sản phẩm.</span>
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-square cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              {/* Drag handle */}
              <div className="absolute top-2 left-2 bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />

              {/* Delete button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Primary image badge */}
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
        <GripVertical className="h-3 w-3 inline mr-1" />
        Kéo thả ảnh để sắp xếp lại thứ tự. Ảnh đầu tiên sẽ là ảnh chính của sản
        phẩm.
      </p>
    </div>
  );
}
