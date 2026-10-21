import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when totalPages is 0 or negative', () => {
    const { container: containerZero } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />,
    );
    expect(containerZero.firstChild).toBeNull();

    cleanup();

    const { container: containerNegative } = render(
      <Pagination currentPage={1} totalPages={-1} onPageChange={vi.fn()} />,
    );
    expect(containerNegative.firstChild).toBeNull();
  });

  it('renders page buttons and handles next/prev navigation on first page', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );

    const buttons = container.querySelectorAll('button');
    const prevButton = buttons[0];
    const nextButton = buttons[buttons.length - 1];

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByRole('button', { name: String(i) }),
      ).toBeInTheDocument();
    }

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables next button and handles prev navigation on last page', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />,
    );

    const buttons = container.querySelectorAll('button');
    const prevButton = buttons[0];
    const nextButton = buttons[buttons.length - 1];

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();

    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('renders jump to first and last page with both ellipses when in the middle', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    const ellipses = screen.getAllByText('...');
    expect(ellipses).toHaveLength(2);

    const firstPageBtn = screen.getByRole('button', { name: '1' });
    const lastPageBtn = screen.getByRole('button', { name: '10' });

    expect(firstPageBtn).toBeInTheDocument();
    expect(lastPageBtn).toBeInTheDocument();

    fireEvent.click(firstPageBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(lastPageBtn);
    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  it('renders first page jump button without leading ellipsis when startPage is 2', () => {
    const onPageChange = vi.fn();
    // currentPage=4, totalPages=10 => startPage=2, endPage=6
    render(
      <Pagination
        currentPage={4}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();

    const ellipses = screen.getAllByText('...');
    expect(ellipses).toHaveLength(1);
  });

  it('renders last page jump button without trailing ellipsis when endPage is totalPages - 1', () => {
    const onPageChange = vi.fn();
    // currentPage=7, totalPages=10 => startPage=5, endPage=9
    render(
      <Pagination
        currentPage={7}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();

    const ellipses = screen.getAllByText('...');
    expect(ellipses).toHaveLength(1);
  });

  it('adjusts startPage when near the end and endPage - startPage < showPages - 1', () => {
    const onPageChange = vi.fn();
    // currentPage=9, totalPages=10 => startPage adjusted to 6, endPage=10
    render(
      <Pagination
        currentPage={9}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getAllByText('...')).toHaveLength(1);
  });

  it('handles small totalPages where totalPages is greater than 1 but less than showPages', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />,
    );

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={vi.fn()}
        className="custom-pagination-root"
      />,
    );
    expect(container.firstChild).toHaveClass('custom-pagination-root');
  });
});
