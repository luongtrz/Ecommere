import React from 'react';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

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

describe('DropdownMenu components', () => {
  it('has correct displayNames for all custom forwardRef components', () => {
    expect(DropdownMenuSubTrigger.displayName).toBe(
      DropdownMenuPrimitive.SubTrigger.displayName,
    );
    expect(DropdownMenuSubContent.displayName).toBe(
      DropdownMenuPrimitive.SubContent.displayName,
    );
    expect(DropdownMenuContent.displayName).toBe(
      DropdownMenuPrimitive.Content.displayName,
    );
    expect(DropdownMenuItem.displayName).toBe(
      DropdownMenuPrimitive.Item.displayName,
    );
    expect(DropdownMenuCheckboxItem.displayName).toBe(
      DropdownMenuPrimitive.CheckboxItem.displayName,
    );
    expect(DropdownMenuRadioItem.displayName).toBe(
      DropdownMenuPrimitive.RadioItem.displayName,
    );
    expect(DropdownMenuLabel.displayName).toBe(
      DropdownMenuPrimitive.Label.displayName,
    );
    expect(DropdownMenuSeparator.displayName).toBe(
      DropdownMenuPrimitive.Separator.displayName,
    );
    expect(DropdownMenuShortcut.displayName).toBe('DropdownMenuShortcut');
  });

  it('renders menu trigger and opens content on click', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Mở menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleSelect}>
            Tùy chọn 1
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole('button', { name: 'Mở menu' });
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByText('Tùy chọn 1')).not.toBeInTheDocument();

    await user.click(trigger);

    const item = await screen.findByText('Tùy chọn 1');
    expect(item).toBeInTheDocument();

    await user.click(item);
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it('renders DropdownMenuContent with default sideOffset and custom className', () => {
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent ref={contentRef} className="custom-content-class">
          <DropdownMenuItem>Item A</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(contentRef.current).toBeInstanceOf(HTMLElement);
    expect(contentRef.current).toHaveClass('custom-content-class');
    expect(contentRef.current).toHaveClass('z-50');
  });

  it('renders DropdownMenuContent with explicit sideOffset', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={12} data-testid="dropdown-content">
          <DropdownMenuItem>Item B</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const content = screen.getByTestId('dropdown-content');
    expect(content).toBeInTheDocument();
  });

  it('renders DropdownMenuItem with inset=true and inset=false/omitted, custom className and ref forwarding', () => {
    const itemRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem
            ref={itemRef}
            inset={true}
            className="custom-item-class"
            data-testid="inset-item"
          >
            Mục thụt lề
          </DropdownMenuItem>
          <DropdownMenuItem inset={false} data-testid="no-inset-item">
            Mục bình thường
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="default-inset-item">
            Mục mặc định
          </DropdownMenuItem>
          <DropdownMenuItem disabled data-testid="disabled-item">
            Mục bị vô hiệu
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(itemRef.current).toBeInstanceOf(HTMLElement);
    const insetItem = screen.getByTestId('inset-item');
    expect(insetItem).toHaveClass('pl-8');
    expect(insetItem).toHaveClass('custom-item-class');

    const noInsetItem = screen.getByTestId('no-inset-item');
    expect(noInsetItem).not.toHaveClass('pl-8');

    const defaultInsetItem = screen.getByTestId('default-inset-item');
    expect(defaultInsetItem).not.toHaveClass('pl-8');

    const disabledItem = screen.getByTestId('disabled-item');
    expect(disabledItem).toHaveAttribute('data-disabled');
  });

  it('renders DropdownMenuCheckboxItem checked and unchecked, handles toggle and ref', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();
    const checkboxRef = React.createRef<HTMLDivElement>();

    const { rerender } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            ref={checkboxRef}
            checked={true}
            onCheckedChange={handleCheckedChange}
            className="custom-checkbox"
            data-testid="checkbox-item"
          >
            Hiển thị thanh công cụ
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(checkboxRef.current).toBeInstanceOf(HTMLElement);
    const checkboxItem = screen.getByTestId('checkbox-item');
    expect(checkboxItem).toHaveClass('custom-checkbox');
    expect(checkboxItem).toHaveAttribute('aria-checked', 'true');
    // Indicator contains Check icon
    expect(checkboxItem.querySelector('svg')).toBeInTheDocument();

    await user.click(checkboxItem);
    expect(handleCheckedChange).toHaveBeenCalledWith(false);

    // Rerender with checked=false
    rerender(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} data-testid="checkbox-item">
            Hiển thị thanh công cụ
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const uncheckedItem = screen.getByTestId('checkbox-item');
    expect(uncheckedItem).toHaveAttribute('aria-checked', 'false');
  });

  it('renders DropdownMenuRadioGroup and DropdownMenuRadioItem, handles selection and ref', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const radioRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value="opt1"
            onValueChange={handleValueChange}
          >
            <DropdownMenuRadioItem
              ref={radioRef}
              value="opt1"
              className="custom-radio"
              data-testid="radio-1"
            >
              Lựa chọn 1
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="opt2" data-testid="radio-2">
              Lựa chọn 2
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(radioRef.current).toBeInstanceOf(HTMLElement);
    const radio1 = screen.getByTestId('radio-1');
    const radio2 = screen.getByTestId('radio-2');

    expect(radio1).toHaveClass('custom-radio');
    expect(radio1).toHaveAttribute('aria-checked', 'true');
    expect(radio1.querySelector('svg')).toBeInTheDocument();

    expect(radio2).toHaveAttribute('aria-checked', 'false');

    await user.click(radio2);
    expect(handleValueChange).toHaveBeenCalledWith('opt2');
  });

  it('renders DropdownMenuLabel with inset=true and inset=false/omitted, custom className and ref forwarding', () => {
    const labelRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuLabel
            ref={labelRef}
            inset={true}
            className="custom-label"
            data-testid="inset-label"
          >
            Nhãn thụt lề
          </DropdownMenuLabel>
          <DropdownMenuLabel inset={false} data-testid="no-inset-label">
            Nhãn thường
          </DropdownMenuLabel>
          <DropdownMenuLabel data-testid="default-label">
            Nhãn mặc định
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(labelRef.current).toBeInstanceOf(HTMLElement);
    const insetLabel = screen.getByTestId('inset-label');
    expect(insetLabel).toHaveClass('pl-8');
    expect(insetLabel).toHaveClass('custom-label');

    const noInsetLabel = screen.getByTestId('no-inset-label');
    expect(noInsetLabel).not.toHaveClass('pl-8');

    const defaultLabel = screen.getByTestId('default-label');
    expect(defaultLabel).not.toHaveClass('pl-8');
  });

  it('renders DropdownMenuSeparator with custom className and ref forwarding', () => {
    const sepRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem>Mục trên</DropdownMenuItem>
          <DropdownMenuSeparator
            ref={sepRef}
            className="custom-separator"
            data-testid="separator"
          />
          <DropdownMenuItem>Mục dưới</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(sepRef.current).toBeInstanceOf(HTMLElement);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('custom-separator');
    expect(separator).toHaveClass('-mx-1');
  });

  it('renders DropdownMenuShortcut with children and custom className', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Lưu
            <DropdownMenuShortcut
              className="custom-shortcut"
              data-testid="shortcut"
            >
              ⌘S
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const shortcut = screen.getByTestId('shortcut');
    expect(shortcut).toHaveClass('custom-shortcut');
    expect(shortcut).toHaveClass('ml-auto');
    expect(shortcut).toHaveTextContent('⌘S');
  });

  it('renders DropdownMenuSub with SubTrigger and SubContent, testing inset branches, custom className and refs', () => {
    const subTriggerRef = React.createRef<HTMLDivElement>();
    const subContentRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuSub open={true}>
              <DropdownMenuSubTrigger
                ref={subTriggerRef}
                inset={true}
                className="custom-subtrigger"
                data-testid="sub-trigger-inset"
              >
                Menu con thụt lề
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  ref={subContentRef}
                  className="custom-subcontent"
                  data-testid="sub-content"
                >
                  <DropdownMenuItem>Mục con 1</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(subTriggerRef.current).toBeInstanceOf(HTMLElement);
    expect(subContentRef.current).toBeInstanceOf(HTMLElement);

    const subTriggerInset = screen.getByTestId('sub-trigger-inset');
    expect(subTriggerInset).toHaveClass('pl-8');
    expect(subTriggerInset).toHaveClass('custom-subtrigger');
    expect(subTriggerInset.querySelector('svg')).toBeInTheDocument();

    const subContent = screen.getByTestId('sub-content');
    expect(subContent).toHaveClass('custom-subcontent');
    expect(screen.getByText('Mục con 1')).toBeInTheDocument();
  });

  it('renders DropdownMenuSubTrigger without inset (inset=false/omitted)', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              inset={false}
              data-testid="sub-trigger-no-inset"
            >
              Menu con không thụt lề
            </DropdownMenuSubTrigger>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-testid="sub-trigger-default">
              Menu con mặc định
            </DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const noInsetItem = screen.getByTestId('sub-trigger-no-inset');
    expect(noInsetItem).not.toHaveClass('pl-8');

    const defaultItem = screen.getByTestId('sub-trigger-default');
    expect(defaultItem).not.toHaveClass('pl-8');
  });
});
