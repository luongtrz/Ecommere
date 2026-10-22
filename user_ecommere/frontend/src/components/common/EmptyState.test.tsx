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

    // Default icon
    const iconSvg = container.querySelector('svg');
    expect(iconSvg).toBeInTheDocument();
    expect(iconSvg).toHaveClass('h-16', 'w-16');

    // No description or action rendered
    expect(container.querySelector('p')).not.toBeInTheDocument();
    expect(within(container).queryByRole('button')).not.toBeInTheDocument();

    // Default container classes
    expect(container.firstChild).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'py-12',
      'text-center',
    );
  });

  it('renders custom icon instead of the default PackageOpen icon when icon prop is provided', () => {
    const { container } = render(
      <EmptyState
        title="Giỏ hàng trống"
        icon={<div data-testid="custom-cart-icon">Biểu tượng tùy chỉnh</div>}
      />,
    );

    expect(
      within(container).getByTestId('custom-cart-icon'),
    ).toBeInTheDocument();
    expect(
      within(container).getByText('Biểu tượng tùy chỉnh'),
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders description paragraph when description prop is provided', () => {
    const { container } = render(
      <EmptyState
        title="Không tìm thấy sản phẩm"
        description="Vui lòng thử lại với từ khóa khác hoặc điều chỉnh bộ lọc."
      />,
    );

    const desc = within(container).getByText(
      'Vui lòng thử lại với từ khóa khác hoặc điều chỉnh bộ lọc.',
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

  it('does not render description when description prop is omitted or undefined', () => {
    const { container } = render(
      <EmptyState title="Chưa có thông báo" description={undefined} />,
    );
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders action element and responds to user interaction', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <EmptyState
        title="Chưa có địa chỉ giao hàng"
        action={
          <button type="button" onClick={handleClick}>
            Thêm địa chỉ mới
          </button>
        }
      />,
    );

    const actionButton = within(container).getByRole('button', {
      name: 'Thêm địa chỉ mới',
    });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action element when action prop is omitted or undefined', () => {
    const { container } = render(
      <EmptyState title="Chưa có lịch sử giao dịch" action={undefined} />,
    );
    expect(within(container).queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });

  it('applies custom className to the root container', () => {
    const { container } = render(
      <EmptyState
        title="Trống"
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
        icon={<span data-testid="all-props-icon">Icon</span>}
        title="Danh sách yêu thích trống"
        description="Bạn chưa lưu sản phẩm nào vào danh sách yêu thích."
        action={
          <button type="button" onClick={handleAction}>
            Khám phá sản phẩm
          </button>
        }
        className="full-props-class"
      />,
    );

    expect(within(container).getByTestId('all-props-icon')).toBeInTheDocument();
    expect(
      within(container).getByRole('heading', {
        level: 3,
        name: 'Danh sách yêu thích trống',
      }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText(
        'Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.',
      ),
    ).toBeInTheDocument();
    const button = within(container).getByRole('button', {
      name: 'Khám phá sản phẩm',
    });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toHaveClass('full-props-class');
  });
});
