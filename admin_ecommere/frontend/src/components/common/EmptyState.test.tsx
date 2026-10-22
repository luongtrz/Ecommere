import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { EmptyState } from './EmptyState';

afterEach(() => {
  cleanup();
});

describe('EmptyState', () => {
  it('renders title and default PackageOpen icon when minimal props are provided', () => {
    const { container } = render(<EmptyState title="Không có dữ liệu" />);

    const heading = within(container).getByRole('heading', {
      level: 3,
      name: 'Không có dữ liệu',
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'mb-2');

    // Default PackageOpen svg icon
    const iconSvg = container.querySelector('svg');
    expect(iconSvg).toBeInTheDocument();
    expect(iconSvg).toHaveClass('h-16', 'w-16');

    // No description paragraph or action rendered
    expect(container.querySelector('p')).not.toBeInTheDocument();
    expect(within(container).queryByRole('button')).not.toBeInTheDocument();

    // Default container styling
    expect(container.firstChild).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'py-12',
      'text-center',
    );
  });

  it('renders custom icon instead of default PackageOpen icon when icon prop is provided', () => {
    const { container } = render(
      <EmptyState
        title="Không tìm thấy kết quả"
        icon={<div data-testid="custom-empty-icon">Biểu tượng tùy chỉnh</div>}
      />,
    );

    expect(
      within(container).getByTestId('custom-empty-icon'),
    ).toBeInTheDocument();
    expect(
      within(container).getByText('Biểu tượng tùy chỉnh'),
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders description paragraph when description prop is provided', () => {
    const { container } = render(
      <EmptyState
        title="Danh sách trống"
        description="Hiện tại không có mục nào để hiển thị."
      />,
    );

    const desc = within(container).getByText(
      'Hiện tại không có mục nào để hiển thị.',
    );
    expect(desc).toBeInTheDocument();
    expect(desc.tagName).toBe('P');
    expect(desc).toHaveClass(
      'text-sm',
      'text-muted-foreground',
      'mb-4',
      'max-w-sm',
    );
  });

  it('does not render description paragraph when description is undefined', () => {
    const { container } = render(
      <EmptyState title="Chưa có dữ liệu" description={undefined} />,
    );
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders action element and responds to user interaction', () => {
    const handleActionClick = vi.fn();
    const { container } = render(
      <EmptyState
        title="Chưa có đơn hàng"
        action={
          <button type="button" onClick={handleActionClick}>
            Tạo đơn hàng mới
          </button>
        }
      />,
    );

    const actionButton = within(container).getByRole('button', {
      name: 'Tạo đơn hàng mới',
    });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(handleActionClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action element when action prop is undefined', () => {
    const { container } = render(
      <EmptyState title="Không có thông báo" action={undefined} />,
    );
    expect(within(container).queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });

  it('applies custom className to the root container', () => {
    const { container } = render(
      <EmptyState
        title="Tiêu đề"
        className="my-custom-empty-class border rounded-lg"
      />,
    );

    expect(container.firstChild).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'py-12',
      'text-center',
      'my-custom-empty-class',
      'border',
      'rounded-lg',
    );
  });

  it('renders correctly with all props provided simultaneously', () => {
    const handleAction = vi.fn();
    const { container } = render(
      <EmptyState
        icon={<span data-testid="all-props-icon">Biểu tượng</span>}
        title="Không tìm thấy sản phẩm phù hợp"
        description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
        action={
          <button type="button" onClick={handleAction}>
            Xóa bộ lọc
          </button>
        }
        className="extra-wrapper-class"
      />,
    );

    expect(within(container).getByTestId('all-props-icon')).toBeInTheDocument();
    expect(
      within(container).getByRole('heading', {
        level: 3,
        name: 'Không tìm thấy sản phẩm phù hợp',
      }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText(
        'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.',
      ),
    ).toBeInTheDocument();

    const actionBtn = within(container).getByRole('button', {
      name: 'Xóa bộ lọc',
    });
    expect(actionBtn).toBeInTheDocument();
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);

    expect(container.firstChild).toHaveClass('extra-wrapper-class');
  });
});
