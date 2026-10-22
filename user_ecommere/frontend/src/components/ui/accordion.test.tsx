import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './accordion';

afterEach(() => {
  cleanup();
});

describe('Accordion components', () => {
  it('renders accordion with single collapsible mode and toggles items', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Câu hỏi 1</AccordionTrigger>
          <AccordionContent>Nội dung câu trả lời 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Câu hỏi 2</AccordionTrigger>
          <AccordionContent>Nội dung câu trả lời 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger1 = screen.getByRole('button', { name: /Câu hỏi 1/i });
    const trigger2 = screen.getByRole('button', { name: /Câu hỏi 2/i });

    expect(trigger1).toHaveAttribute('data-state', 'open');
    expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Nội dung câu trả lời 1')).toBeVisible();

    expect(trigger2).toHaveAttribute('data-state', 'closed');
    expect(trigger2).toHaveAttribute('aria-expanded', 'false');

    // Click trigger 2 to open item-2 and close item-1
    await user.click(trigger2);

    expect(trigger2).toHaveAttribute('data-state', 'open');
    expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Nội dung câu trả lời 2')).toBeVisible();

    expect(trigger1).toHaveAttribute('data-state', 'closed');
    expect(trigger1).toHaveAttribute('aria-expanded', 'false');

    // Click trigger 2 again to collapse it
    await user.click(trigger2);

    expect(trigger2).toHaveAttribute('data-state', 'closed');
    expect(trigger2).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports multiple opened items when type is multiple', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple" defaultValue={['item-1']}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Mục 1</AccordionTrigger>
          <AccordionContent>Chi tiết mục 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Mục 2</AccordionTrigger>
          <AccordionContent>Chi tiết mục 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger1 = screen.getByRole('button', { name: /Mục 1/i });
    const trigger2 = screen.getByRole('button', { name: /Mục 2/i });

    expect(trigger1).toHaveAttribute('data-state', 'open');
    expect(screen.getByText('Chi tiết mục 1')).toBeVisible();

    await user.click(trigger2);

    expect(trigger1).toHaveAttribute('data-state', 'open');
    expect(trigger2).toHaveAttribute('data-state', 'open');
    expect(screen.getByText('Chi tiết mục 1')).toBeVisible();
    expect(screen.getByText('Chi tiết mục 2')).toBeVisible();
  });

  it('renders ChevronDown icon inside AccordionTrigger', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Tiêu đề kiểm tra</AccordionTrigger>
          <AccordionContent>Nội dung</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass('h-4');
    expect(svgIcon).toHaveClass('w-4');
    expect(svgIcon).toHaveClass('shrink-0');
    expect(svgIcon).toHaveClass('transition-transform');
  });

  it('applies custom className to AccordionItem, AccordionTrigger, and AccordionContent', () => {
    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem
          value="item-1"
          className="custom-item-class"
          data-testid="item-1"
        >
          <AccordionTrigger className="custom-trigger-class">
            Tiêu đề có lớp riêng
          </AccordionTrigger>
          <AccordionContent
            className="custom-content-class"
            data-testid="content-1"
          >
            Nội dung có lớp riêng
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const item = screen.getByTestId('item-1');
    expect(item).toHaveClass('border-b');
    expect(item).toHaveClass('custom-item-class');

    const trigger = screen.getByRole('button', {
      name: /Tiêu đề có lớp riêng/i,
    });
    expect(trigger).toHaveClass('custom-trigger-class');
    expect(trigger).toHaveClass('flex-1');

    const contentText = screen.getByText('Nội dung có lớp riêng');
    expect(contentText).toHaveClass('pb-4');
    expect(contentText).toHaveClass('pt-0');
    expect(contentText).toHaveClass('custom-content-class');
  });

  it('renders AccordionContent with forceMount when closed', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Tiêu đề</AccordionTrigger>
          <AccordionContent forceMount data-testid="forced-content">
            Nội dung hiển thị khi đóng
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const contentWrapper = screen.getByTestId('forced-content');
    expect(contentWrapper).toHaveAttribute('data-state', 'closed');
    expect(contentWrapper).toHaveClass('overflow-hidden');
    expect(contentWrapper).toHaveClass('text-sm');
  });

  it('forwards refs correctly to DOM elements', () => {
    const itemRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" ref={itemRef}>
          <AccordionTrigger ref={triggerRef}>
            Tiêu đề tham chiếu
          </AccordionTrigger>
          <AccordionContent ref={contentRef}>
            Nội dung tham chiếu
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has correct display names on components', () => {
    expect(AccordionItem.displayName).toBe('AccordionItem');
    expect(AccordionTrigger.displayName).toBe(
      AccordionPrimitive.Trigger.displayName,
    );
    expect(AccordionContent.displayName).toBe(
      AccordionPrimitive.Content.displayName,
    );
  });

  it('respects disabled state on an item', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" disabled>
          <AccordionTrigger>Mục vô hiệu hóa</AccordionTrigger>
          <AccordionContent>Không thể xem</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole('button', { name: /Mục vô hiệu hóa/i });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('data-state', 'closed');
    expect(screen.queryByText('Không thể xem')).not.toBeInTheDocument();
  });
});
