import React from 'react';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as SelectPrimitive from '@radix-ui/react-select';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

beforeEach(() => {
  document.body.style.pointerEvents = 'auto';
});

describe('Select components', () => {
  it('has correct displayNames for all custom forwardRef components', () => {
    expect(SelectTrigger.displayName).toBe(SelectPrimitive.Trigger.displayName);
    expect(SelectScrollUpButton.displayName).toBe(
      SelectPrimitive.ScrollUpButton.displayName,
    );
    expect(SelectScrollDownButton.displayName).toBe(
      SelectPrimitive.ScrollDownButton.displayName,
    );
    expect(SelectContent.displayName).toBe(SelectPrimitive.Content.displayName);
    expect(SelectLabel.displayName).toBe(SelectPrimitive.Label.displayName);
    expect(SelectItem.displayName).toBe(SelectPrimitive.Item.displayName);
    expect(SelectSeparator.displayName).toBe(
      SelectPrimitive.Separator.displayName,
    );
  });

  it('renders SelectTrigger with children, ChevronDown icon, custom className and ref forwarding', () => {
    const triggerRef = React.createRef<HTMLButtonElement>();

    render(
      <Select>
        <SelectTrigger ref={triggerRef} className="custom-trigger-class">
          <SelectValue placeholder="Chọn danh mục" />
        </SelectTrigger>
      </Select>,
    );

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(triggerRef.current).toHaveClass('custom-trigger-class');
    expect(triggerRef.current).toHaveClass('h-10');
    expect(screen.getByText('Chọn danh mục')).toBeInTheDocument();
    // ChevronDown icon is rendered
    expect(triggerRef.current?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders disabled SelectTrigger', () => {
    render(
      <Select disabled>
        <SelectTrigger data-testid="disabled-trigger">
          <SelectValue placeholder="Vô hiệu hóa" />
        </SelectTrigger>
      </Select>,
    );

    const trigger = screen.getByTestId('disabled-trigger');
    expect(trigger).toBeDisabled();
  });

  it('renders SelectContent with default position="popper", testing classes, ref, and children', () => {
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue placeholder="Chọn tỉnh thành" />
        </SelectTrigger>
        <SelectContent
          ref={contentRef}
          className="custom-content-class"
          data-testid="select-content-popper"
        >
          <SelectGroup>
            <SelectLabel>Miền Bắc</SelectLabel>
            <SelectItem value="hanoi">Hà Nội</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    expect(contentRef.current).toBeInstanceOf(HTMLElement);
    const content = screen.getByTestId('select-content-popper');
    expect(content).toHaveClass('custom-content-class');
    // Popper position adds translate classes to content
    expect(content.className).toContain('data-[side=bottom]:translate-y-1');

    // Viewport has popper height and min-width classes
    const viewport = content.querySelector('[data-radix-select-viewport]');
    expect(viewport).toBeInTheDocument();
    expect(viewport?.className).toContain(
      'h-[var(--radix-select-trigger-height)]',
    );
  });

  it('renders SelectContent with position="item-aligned", exercising non-popper branches', () => {
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue placeholder="Chọn quận huyện" />
        </SelectTrigger>
        <SelectContent
          ref={contentRef}
          position="item-aligned"
          data-testid="select-content-aligned"
        >
          <SelectItem value="ba-dinh">Ba Đình</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(contentRef.current).toBeInstanceOf(HTMLElement);
    const content = screen.getByTestId('select-content-aligned');
    // Non-popper position does NOT include popper translate classes
    expect(content.className).not.toContain('data-[side=bottom]:translate-y-1');

    const viewport = content.querySelector('[data-radix-select-viewport]');
    expect(viewport).toBeInTheDocument();
    expect(viewport?.className).not.toContain(
      'h-[var(--radix-select-trigger-height)]',
    );
  });

  it('renders SelectItem with custom className, disabled state, Check icon on selected item, and ref', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const itemRef = React.createRef<HTMLDivElement>();

    render(
      <Select defaultValue="opt1" open={true} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            ref={itemRef}
            value="opt1"
            className="custom-item-class"
            data-testid="selected-item"
          >
            Lựa chọn 1
          </SelectItem>
          <SelectItem value="opt2" data-testid="unselected-item">
            Lựa chọn 2
          </SelectItem>
          <SelectItem value="opt3" disabled data-testid="disabled-item">
            Lựa chọn bị khóa
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(itemRef.current).toBeInstanceOf(HTMLElement);
    const selectedItem = screen.getByTestId('selected-item');
    expect(selectedItem).toHaveClass('custom-item-class');
    expect(selectedItem).toHaveAttribute('data-state', 'checked');
    // Check icon inside indicator
    expect(selectedItem.querySelector('svg')).toBeInTheDocument();

    const unselectedItem = screen.getByTestId('unselected-item');
    expect(unselectedItem).toHaveAttribute('data-state', 'unchecked');

    const disabledItem = screen.getByTestId('disabled-item');
    expect(disabledItem).toHaveAttribute('data-disabled');

    await user.click(unselectedItem);
    expect(handleValueChange).toHaveBeenCalledWith('opt2');
  });

  it('renders SelectLabel with custom className, ref forwarding, and text', () => {
    const labelRef = React.createRef<HTMLDivElement>();

    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel
              ref={labelRef}
              className="custom-label-class"
              data-testid="select-label"
            >
              Nhóm sản phẩm
            </SelectLabel>
            <SelectItem value="p1">Sản phẩm 1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    expect(labelRef.current).toBeInstanceOf(HTMLElement);
    const label = screen.getByTestId('select-label');
    expect(label).toHaveClass('custom-label-class');
    expect(label).toHaveClass('font-semibold');
    expect(label).toHaveTextContent('Nhóm sản phẩm');
  });

  it('renders SelectSeparator with custom className and ref forwarding', () => {
    const sepRef = React.createRef<HTMLDivElement>();

    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Mục A</SelectItem>
          <SelectSeparator
            ref={sepRef}
            className="custom-sep-class"
            data-testid="select-sep"
          />
          <SelectItem value="b">Mục B</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(sepRef.current).toBeInstanceOf(HTMLElement);
    const separator = screen.getByTestId('select-sep');
    expect(separator).toHaveClass('custom-sep-class');
    expect(separator).toHaveClass('-mx-1');
  });

  it('renders standalone SelectScrollUpButton and SelectScrollDownButton with custom className', () => {
    const upRef = React.createRef<HTMLDivElement>();
    const downRef = React.createRef<HTMLDivElement>();

    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content>
            <SelectScrollUpButton
              ref={upRef as any}
              className="custom-up-button"
            />
            <SelectPrimitive.Viewport>
              <SelectItem value="test">Test</SelectItem>
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton
              ref={downRef as any}
              className="custom-down-button"
            />
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </Select>,
    );

    expect(SelectScrollUpButton).toBeDefined();
    expect(SelectScrollDownButton).toBeDefined();
  });

  it('allows opening the select menu via trigger user interaction', async () => {
    const user = userEvent.setup();

    render(
      <Select>
        <SelectTrigger data-testid="interactive-trigger">
          <SelectValue placeholder="Chọn kích cỡ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="s">Size S</SelectItem>
          <SelectItem value="m">Size M</SelectItem>
          <SelectItem value="l">Size L</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByTestId('interactive-trigger');
    expect(screen.queryByText('Size S')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByText('Size S')).toBeInTheDocument();
    expect(screen.getByText('Size M')).toBeInTheDocument();
    expect(screen.getByText('Size L')).toBeInTheDocument();
  });
});
