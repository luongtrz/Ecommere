import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

describe('Table UI components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('displayName checks', () => {
    it('sets correct displayName for each component', () => {
      expect(Table.displayName).toBe('Table');
      expect(TableHeader.displayName).toBe('TableHeader');
      expect(TableBody.displayName).toBe('TableBody');
      expect(TableFooter.displayName).toBe('TableFooter');
      expect(TableRow.displayName).toBe('TableRow');
      expect(TableHead.displayName).toBe('TableHead');
      expect(TableCell.displayName).toBe('TableCell');
      expect(TableCaption.displayName).toBe('TableCaption');
    });
  });

  describe('Table', () => {
    it('renders table with default styling inside a wrapper div', () => {
      render(<Table data-testid="table-default" />);
      const table = screen.getByTestId('table-default');

      expect(table).toBeInTheDocument();
      expect(table.tagName).toBe('TABLE');
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
      expect(table.parentElement).toHaveClass(
        'relative',
        'w-full',
        'overflow-auto',
      );
    });

    it('merges custom className with default classes', () => {
      render(
        <Table
          className="custom-table-class"
          data-testid="table-custom-class"
        />,
      );
      const table = screen.getByTestId('table-custom-class');

      expect(table).toHaveClass(
        'custom-table-class',
        'w-full',
        'caption-bottom',
        'text-sm',
      );
    });

    it('forwards ref to the HTMLTableElement', () => {
      const ref = React.createRef<HTMLTableElement>();
      render(<Table ref={ref} data-testid="table-ref" />);

      expect(ref.current).toBeInstanceOf(HTMLTableElement);
      expect(ref.current).toBe(screen.getByTestId('table-ref'));
    });

    it('passes extra attributes and handles user interactions', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Table
          data-testid="table-click"
          aria-label="Product list"
          onClick={handleClick}
        />,
      );

      const table = screen.getByTestId('table-click');
      expect(table).toHaveAttribute('aria-label', 'Product list');

      await user.click(table);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('TableHeader', () => {
    it('renders thead with default styling', () => {
      render(
        <table>
          <TableHeader data-testid="header-default">
            <tr>
              <th>Title</th>
            </tr>
          </TableHeader>
        </table>,
      );
      const header = screen.getByTestId('header-default');

      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('THEAD');
      expect(header).toHaveClass('[&_tr]:border-b');
    });

    it('merges custom className', () => {
      render(
        <table>
          <TableHeader
            className="custom-header"
            data-testid="header-custom-class"
          />
        </table>,
      );
      const header = screen.getByTestId('header-custom-class');

      expect(header).toHaveClass('custom-header', '[&_tr]:border-b');
    });

    it('forwards ref to HTMLTableSectionElement', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableHeader ref={ref} data-testid="header-ref" />
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
      expect(ref.current).toBe(screen.getByTestId('header-ref'));
    });
  });

  describe('TableBody', () => {
    it('renders tbody with default styling', () => {
      render(
        <table>
          <TableBody data-testid="body-default">
            <tr>
              <td>Content</td>
            </tr>
          </TableBody>
        </table>,
      );
      const body = screen.getByTestId('body-default');

      expect(body).toBeInTheDocument();
      expect(body.tagName).toBe('TBODY');
      expect(body).toHaveClass('[&_tr:last-child]:border-0');
    });

    it('merges custom className', () => {
      render(
        <table>
          <TableBody className="custom-body" data-testid="body-custom-class" />
        </table>,
      );
      const body = screen.getByTestId('body-custom-class');

      expect(body).toHaveClass('custom-body', '[&_tr:last-child]:border-0');
    });

    it('forwards ref to HTMLTableSectionElement', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableBody ref={ref} data-testid="body-ref" />
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
      expect(ref.current).toBe(screen.getByTestId('body-ref'));
    });
  });

  describe('TableFooter', () => {
    it('renders tfoot with default styling', () => {
      render(
        <table>
          <TableFooter data-testid="footer-default">
            <tr>
              <td>Footer info</td>
            </tr>
          </TableFooter>
        </table>,
      );
      const footer = screen.getByTestId('footer-default');

      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('TFOOT');
      expect(footer).toHaveClass(
        'border-t',
        'border-slate-200',
        'bg-slate-50',
        'font-medium',
        'text-slate-700',
        '[&>tr]:last:border-b-0',
      );
    });

    it('merges custom className', () => {
      render(
        <table>
          <TableFooter
            className="custom-footer"
            data-testid="footer-custom-class"
          />
        </table>,
      );
      const footer = screen.getByTestId('footer-custom-class');

      expect(footer).toHaveClass('custom-footer', 'border-t', 'bg-slate-50');
    });

    it('forwards ref to HTMLTableSectionElement', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableFooter ref={ref} data-testid="footer-ref" />
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
      expect(ref.current).toBe(screen.getByTestId('footer-ref'));
    });
  });

  describe('TableRow', () => {
    it('renders tr with default styling', () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="row-default">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      );
      const row = screen.getByTestId('row-default');

      expect(row).toBeInTheDocument();
      expect(row.tagName).toBe('TR');
      expect(row).toHaveClass(
        'border-b',
        'border-slate-200',
        'transition-colors',
        'duration-150',
        'hover:bg-slate-50/80',
        'data-[state=selected]:bg-teal-50',
      );
    });

    it('merges custom className and handles selected state', () => {
      render(
        <table>
          <tbody>
            <TableRow
              className="custom-row"
              data-state="selected"
              data-testid="row-custom-class"
            >
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      );
      const row = screen.getByTestId('row-custom-class');

      expect(row).toHaveClass('custom-row', 'border-b');
      expect(row).toHaveAttribute('data-state', 'selected');
    });

    it('forwards ref to HTMLTableRowElement', () => {
      const ref = React.createRef<HTMLTableRowElement>();
      render(
        <table>
          <tbody>
            <TableRow ref={ref} data-testid="row-ref">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
      expect(ref.current).toBe(screen.getByTestId('row-ref'));
    });

    it('handles click events on row', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <table>
          <tbody>
            <TableRow onClick={handleClick} data-testid="row-clickable">
              <td>Clickable</td>
            </TableRow>
          </tbody>
        </table>,
      );

      await user.click(screen.getByTestId('row-clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('TableHead', () => {
    it('renders th with default styling', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="head-default">Header title</TableHead>
            </tr>
          </thead>
        </table>,
      );
      const head = screen.getByTestId('head-default');

      expect(head).toBeInTheDocument();
      expect(head.tagName).toBe('TH');
      expect(head).toHaveClass(
        'h-10',
        'px-4',
        'py-3',
        'text-left',
        'align-middle',
        'text-xs',
        'font-semibold',
        'uppercase',
        'tracking-wider',
        'text-slate-500',
        '[&:has([role=checkbox])]:pr-0',
      );
      expect(head).toHaveTextContent('Header title');
    });

    it('merges custom className and passes extra th props', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead
                className="custom-head"
                scope="col"
                colSpan={2}
                data-testid="head-custom-class"
              >
                Column
              </TableHead>
            </tr>
          </thead>
        </table>,
      );
      const head = screen.getByTestId('head-custom-class');

      expect(head).toHaveClass('custom-head', 'h-10', 'px-4');
      expect(head).toHaveAttribute('scope', 'col');
      expect(head).toHaveAttribute('colspan', '2');
    });

    it('forwards ref to HTMLTableCellElement', () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <table>
          <thead>
            <tr>
              <TableHead ref={ref} data-testid="head-ref">
                Head
              </TableHead>
            </tr>
          </thead>
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
      expect(ref.current).toBe(screen.getByTestId('head-ref'));
    });
  });

  describe('TableCell', () => {
    it('renders td with default styling', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="cell-default">Cell text</TableCell>
            </tr>
          </tbody>
        </table>,
      );
      const cell = screen.getByTestId('cell-default');

      expect(cell).toBeInTheDocument();
      expect(cell.tagName).toBe('TD');
      expect(cell).toHaveClass(
        'px-4',
        'py-3',
        'align-middle',
        'text-sm',
        'text-slate-700',
        '[&:has([role=checkbox])]:pr-0',
      );
      expect(cell).toHaveTextContent('Cell text');
    });

    it('merges custom className and extra props', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell
                className="custom-cell"
                colSpan={3}
                data-testid="cell-custom-class"
              >
                Merged cell
              </TableCell>
            </tr>
          </tbody>
        </table>,
      );
      const cell = screen.getByTestId('cell-custom-class');

      expect(cell).toHaveClass('custom-cell', 'px-4', 'py-3', 'align-middle');
      expect(cell).toHaveAttribute('colspan', '3');
    });

    it('forwards ref to HTMLTableCellElement', () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <table>
          <tbody>
            <tr>
              <TableCell ref={ref} data-testid="cell-ref">
                Cell
              </TableCell>
            </tr>
          </tbody>
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
      expect(ref.current).toBe(screen.getByTestId('cell-ref'));
    });
  });

  describe('TableCaption', () => {
    it('renders caption with default styling', () => {
      render(
        <table>
          <TableCaption data-testid="caption-default">
            A list of recent invoices
          </TableCaption>
        </table>,
      );
      const caption = screen.getByTestId('caption-default');

      expect(caption).toBeInTheDocument();
      expect(caption.tagName).toBe('CAPTION');
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-slate-500');
      expect(caption).toHaveTextContent('A list of recent invoices');
    });

    it('merges custom className', () => {
      render(
        <table>
          <TableCaption
            className="custom-caption"
            data-testid="caption-custom-class"
          >
            Caption
          </TableCaption>
        </table>,
      );
      const caption = screen.getByTestId('caption-custom-class');

      expect(caption).toHaveClass('custom-caption', 'mt-4', 'text-sm');
    });

    it('forwards ref to HTMLTableCaptionElement', () => {
      const ref = React.createRef<HTMLTableCaptionElement>();
      render(
        <table>
          <TableCaption ref={ref} data-testid="caption-ref">
            Caption
          </TableCaption>
        </table>,
      );

      expect(ref.current).toBeInstanceOf(HTMLTableCaptionElement);
      expect(ref.current).toBe(screen.getByTestId('caption-ref'));
    });
  });

  describe('Full table integration', () => {
    it('renders a complete structured table correctly', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      render(
        <Table data-testid="composite-table">
          <TableCaption>Danh sách đơn hàng gần đây</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              onClick={() => onRowClick('ORD-001')}
              data-testid="composite-row-1"
            >
              <TableCell className="font-medium">ORD-001</TableCell>
              <TableCell>Đã giao</TableCell>
              <TableCell className="text-right">250.000₫</TableCell>
            </TableRow>
            <TableRow data-state="selected" data-testid="composite-row-2">
              <TableCell className="font-medium">ORD-002</TableCell>
              <TableCell>Đang xử lý</TableCell>
              <TableCell className="text-right">150.000₫</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Tổng cộng</TableCell>
              <TableCell className="text-right">400.000₫</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      expect(screen.getByTestId('composite-table')).toBeInTheDocument();
      expect(
        screen.getByText('Danh sách đơn hàng gần đây'),
      ).toBeInTheDocument();
      expect(screen.getByText('Mã đơn')).toBeInTheDocument();
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Đã giao')).toBeInTheDocument();
      expect(screen.getByText('250.000₫')).toBeInTheDocument();
      expect(screen.getByText('Tổng cộng')).toBeInTheDocument();
      expect(screen.getByText('400.000₫')).toBeInTheDocument();

      const selectedRow = screen.getByTestId('composite-row-2');
      expect(selectedRow).toHaveAttribute('data-state', 'selected');

      await user.click(screen.getByTestId('composite-row-1'));
      expect(onRowClick).toHaveBeenCalledWith('ORD-001');
    });
  });
});
