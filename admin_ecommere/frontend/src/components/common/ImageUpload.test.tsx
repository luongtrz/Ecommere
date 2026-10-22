import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from './ImageUpload';
import apiClient from '@/lib/api';

const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
  apiClient: {
    post: vi.fn(),
  },
}));

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state with default maxImages of 5', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUpload images={[]} onChange={onChange} />,
    );

    expect(screen.getByText('0/5 ảnh')).toBeInTheDocument();
    expect(screen.getByText('Chưa có ảnh nào')).toBeInTheDocument();
    expect(
      screen.getByText('Click "Chọn ảnh" để upload (tối đa 5 ảnh)'),
    ).toBeInTheDocument();

    const uploadButton = screen.getByRole('button', { name: 'Chọn ảnh' });
    expect(uploadButton).not.toBeDisabled();

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).not.toBeDisabled();

    expect(
      screen.getByText(
        'Kéo thả ảnh để sắp xếp lại thứ tự. Ảnh đầu tiên sẽ là ảnh chính của sản phẩm.',
      ),
    ).toBeInTheDocument();
  });

  it('renders custom maxImages correctly', () => {
    const onChange = vi.fn();
    render(<ImageUpload images={[]} onChange={onChange} maxImages={3} />);

    expect(screen.getByText('0/3 ảnh')).toBeInTheDocument();
    expect(
      screen.getByText('Click "Chọn ảnh" để upload (tối đa 3 ảnh)'),
    ).toBeInTheDocument();
  });

  it('disables upload button and file input when max images limit is reached', () => {
    const onChange = vi.fn();
    const existingImages = [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
    ];
    const { container } = render(
      <ImageUpload images={existingImages} onChange={onChange} maxImages={2} />,
    );

    expect(screen.getByText('2/2 ảnh')).toBeInTheDocument();
    const uploadButton = screen.getByRole('button', { name: 'Chọn ảnh' });
    expect(uploadButton).toBeDisabled();

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });

  it('triggers file input click when "Chọn ảnh" button is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUpload images={[]} onChange={onChange} />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const uploadButton = screen.getByRole('button', { name: 'Chọn ảnh' });
    fireEvent.click(uploadButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('renders image cards and displays "Ảnh chính" only for the first image', () => {
    const onChange = vi.fn();
    const images = [
      'https://example.com/cover.jpg',
      'https://example.com/gallery1.jpg',
      'https://example.com/gallery2.jpg',
    ];
    render(<ImageUpload images={images} onChange={onChange} />);

    expect(screen.queryByText('Chưa có ảnh nào')).not.toBeInTheDocument();
    expect(screen.getByAltText('Product 1')).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );
    expect(screen.getByAltText('Product 2')).toHaveAttribute(
      'src',
      'https://example.com/gallery1.jpg',
    );
    expect(screen.getByAltText('Product 3')).toHaveAttribute(
      'src',
      'https://example.com/gallery2.jpg',
    );

    const mainBadges = screen.getAllByText('Ảnh chính');
    expect(mainBadges).toHaveLength(1);
  });

  it('removes an image and notifies via toast when delete button is clicked', () => {
    const onChange = vi.fn();
    const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    const { container } = render(
      <ImageUpload images={images} onChange={onChange} />,
    );

    const cards = container.querySelectorAll('.aspect-square');
    expect(cards).toHaveLength(3);

    // Click delete button on the second image (index 1)
    const secondCardDeleteButton = cards[1].querySelector('button')!;
    fireEvent.click(secondCardDeleteButton);

    expect(onChange).toHaveBeenCalledWith(['img1.jpg', 'img3.jpg']);
    expect(mockToast.info).toHaveBeenCalledWith('Đã xóa ảnh khỏi danh sách');
  });

  describe('drag and drop reordering', () => {
    it('handles dragging cards to reorder images', () => {
      const onChange = vi.fn();
      const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const { container } = render(
        <ImageUpload images={images} onChange={onChange} />,
      );

      const cards = container.querySelectorAll('.aspect-square');

      // Start dragging index 0
      fireEvent.dragStart(cards[0]);
      expect(cards[0]).toHaveClass('opacity-40');

      // Dragging over itself should do nothing
      fireEvent.dragOver(cards[0]);
      expect(onChange).not.toHaveBeenCalled();

      // Drag over index 2
      fireEvent.dragOver(cards[2]);
      expect(onChange).toHaveBeenCalledWith([
        'img2.jpg',
        'img3.jpg',
        'img1.jpg',
      ]);

      // End dragging
      fireEvent.dragEnd(cards[0]);
      expect(cards[0]).not.toHaveClass('opacity-40');
    });

    it('ignores dragOver if no drag was started (draggedIndex is null)', () => {
      const onChange = vi.fn();
      const images = ['img1.jpg', 'img2.jpg'];
      const { container } = render(
        <ImageUpload images={images} onChange={onChange} />,
      );

      const cards = container.querySelectorAll('.aspect-square');
      fireEvent.dragOver(cards[1]);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('file selection and upload', () => {
    it('does nothing when file selection event has empty or null files', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload images={[]} onChange={onChange} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [] } });
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();

      fireEvent.change(fileInput, { target: { files: null } });
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('rejects files larger than 5MB and files with invalid mime types', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload images={[]} onChange={onChange} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      const oversizedFile = new File(['oversized'], 'huge.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(oversizedFile, 'size', {
        value: 6 * 1024 * 1024,
      });

      const invalidTypeFile = new File(['text'], 'document.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(fileInput, {
        target: { files: [oversizedFile, invalidTypeFile] },
      });

      expect(mockToast.error).toHaveBeenCalledWith('Ảnh vượt quá 5MB');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF',
      );
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(fileInput.value).toBe('');
    });

    it('warns when selected valid files exceed remaining available slots', () => {
      const onChange = vi.fn();
      const existingImages = ['1.jpg', '2.jpg', '3.jpg', '4.jpg'];
      const { container } = render(
        <ImageUpload
          images={existingImages}
          onChange={onChange}
          maxImages={5}
        />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      const file1 = new File(['1'], 'test1.png', { type: 'image/png' });
      const file2 = new File(['2'], 'test2.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Chỉ có thể upload tối đa 5 ảnh. Còn 1 slot trống.',
      );
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(fileInput.value).toBe('');
    });

    it('successfully uploads valid files and calls onChange and toast.success', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload
          images={['https://example.com/initial.jpg']}
          onChange={onChange}
        />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      const file1 = new File(['image-content-1'], 'photo1.jpg', {
        type: 'image/jpeg',
      });
      const file2 = new File(['image-content-2'], 'photo2.webp', {
        type: 'image/webp',
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          data: [
            { url: 'https://example.com/uploaded1.jpg' },
            { url: 'https://example.com/uploaded2.webp' },
          ],
        },
      });

      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/uploads/multiple?folder=products',
          expect.any(FormData),
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          'https://example.com/initial.jpg',
          'https://example.com/uploaded1.jpg',
          'https://example.com/uploaded2.webp',
        ]);
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã upload 2 ảnh thành công!',
      );
    });

    it('shows loading state while upload is in progress', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload images={[]} onChange={onChange} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      let resolveUpload: (value: any) => void;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve;
      });
      vi.mocked(apiClient.post).mockReturnValueOnce(uploadPromise as any);

      const file = new File(['content'], 'pic.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('Đang upload...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đang upload...' }),
      ).toBeDisabled();

      resolveUpload!({
        data: {
          data: [{ url: 'https://example.com/pic.png' }],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Chọn ảnh')).toBeInTheDocument();
      });
    });

    it('shows error toast when upload fails with an error message', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload images={[]} onChange={onChange} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Network error 500'),
      );

      const file = new File(['content'], 'pic.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Upload thất bại: Network error 500',
        );
      });

      expect(onChange).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('shows fallback error toast when upload fails without an error message', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload images={[]} onChange={onChange} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      vi.mocked(apiClient.post).mockRejectedValueOnce({});

      const file = new File(['content'], 'pic.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Upload thất bại: Lỗi không xác định',
        );
      });

      expect(onChange).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('skips invalid file in batch and uploads remaining valid files', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <ImageUpload images={[]} onChange={onChange} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      const badTypeFile = new File(['bad'], 'test.txt', {
        type: 'text/plain',
      });
      const validGifFile = new File(['good'], 'test.gif', {
        type: 'image/gif',
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          data: [{ url: 'https://example.com/test.gif' }],
        },
      });

      fireEvent.change(fileInput, {
        target: { files: [badTypeFile, validGifFile] },
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF',
      );

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(['https://example.com/test.gif']);
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã upload 1 ảnh thành công!',
      );
    });
  });
});
