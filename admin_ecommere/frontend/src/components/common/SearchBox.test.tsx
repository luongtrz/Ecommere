import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchBox } from './SearchBox';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderSearchBox() {
  return render(
    <MemoryRouter>
      <SearchBox />
    </MemoryRouter>,
  );
}

describe('SearchBox', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders search form with search icon and input field', () => {
    const { container } = renderSearchBox();

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('relative');

    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
    expect(searchIcon).toHaveClass(
      'absolute',
      'left-3',
      'top-1/2',
      '-translate-y-1/2',
      'h-4',
      'w-4',
      'text-muted-foreground',
    );

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveValue('');
    expect(input).toHaveClass('pl-10');
  });

  it('updates input value when user types into the search box', () => {
    renderSearchBox();
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');

    fireEvent.change(input, { target: { value: 'xịt thơm phòng' } });
    expect(input).toHaveValue('xịt thơm phòng');
  });

  it('does not navigate when form is submitted with empty query', () => {
    const { container } = renderSearchBox();
    const form = container.querySelector('form')!;

    fireEvent.submit(form);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when form is submitted with only whitespace', () => {
    const { container } = renderSearchBox();
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = container.querySelector('form')!;

    fireEvent.change(input, { target: { value: '     ' } });
    fireEvent.submit(form);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /search with encoded query when submitting a valid keyword', () => {
    const { container } = renderSearchBox();
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = container.querySelector('form')!;

    fireEvent.change(input, { target: { value: 'chai xịt' } });
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/search?q=${encodeURIComponent('chai xịt')}`,
    );
  });

  it('trims leading and trailing whitespace from query before navigating', () => {
    const { container } = renderSearchBox();
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = container.querySelector('form')!;

    fireEvent.change(input, { target: { value: '   khử mùi không khí   ' } });
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/search?q=${encodeURIComponent('khử mùi không khí')}`,
    );
  });

  it('properly encodes special characters and symbols in query', () => {
    const { container } = renderSearchBox();
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = container.querySelector('form')!;

    const specialQuery = 'gián & chuột/kiến? 100%';
    fireEvent.change(input, { target: { value: specialQuery } });
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/search?q=${encodeURIComponent(specialQuery)}`,
    );
  });

  it('calls preventDefault on form submit event', () => {
    const { container } = renderSearchBox();
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = container.querySelector('form')!;

    fireEvent.change(input, { target: { value: 'nước lau sàn' } });

    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

    form.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      `/search?q=${encodeURIComponent('nước lau sàn')}`,
    );
  });
});
