import * as React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { RadioGroup, RadioGroupItem } from './radio-group';

afterEach(() => {
  cleanup();
});

describe('RadioGroup', () => {
  it('renders root with default classes and forwards props', () => {
    render(
      <RadioGroup
        data-testid="radio-group-basic"
        aria-label="Phương thức thanh toán"
      >
        <RadioGroupItem value="cod" aria-label="Thanh toán khi nhận hàng" />
      </RadioGroup>,
    );

    const group = screen.getByTestId('radio-group-basic');
    expect(group).toBeInTheDocument();
    expect(group).toHaveClass('grid', 'gap-2');
    expect(group).toHaveAttribute('aria-label', 'Phương thức thanh toán');
  });

  it('merges custom className with default classes', () => {
    render(
      <RadioGroup
        className="custom-radio-group p-4"
        data-testid="radio-group-custom"
      >
        <RadioGroupItem value="bank" />
      </RadioGroup>,
    );

    const group = screen.getByTestId('radio-group-custom');
    expect(group).toHaveClass('grid', 'gap-2', 'custom-radio-group', 'p-4');
  });

  it('forwards ref to the root DOM element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <RadioGroup ref={ref} data-testid="radio-group-ref">
        <RadioGroupItem value="vnpay" />
      </RadioGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByTestId('radio-group-ref'));
  });

  it('has the correct displayName from Radix Root', () => {
    expect(RadioGroup.displayName).toBe(RadioGroupPrimitive.Root.displayName);
  });
});

describe('RadioGroupItem', () => {
  it('renders with base classes and attributes', () => {
    render(
      <RadioGroup defaultValue="cod">
        <RadioGroupItem value="cod" data-testid="item-cod-base" />
      </RadioGroup>,
    );

    const item = screen.getByTestId('item-cod-base');
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass(
      'aspect-square',
      'h-4',
      'w-4',
      'rounded-full',
      'border',
      'border-primary',
      'text-primary',
    );
  });

  it('merges custom className onto RadioGroupItem', () => {
    render(
      <RadioGroup defaultValue="cod">
        <RadioGroupItem
          value="cod"
          className="custom-item-class m-2"
          data-testid="item-custom"
        />
      </RadioGroup>,
    );

    const item = screen.getByTestId('item-custom');
    expect(item).toHaveClass(
      'custom-item-class',
      'm-2',
      'aspect-square',
      'h-4',
      'w-4',
    );
  });

  it('forwards ref to the button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <RadioGroup defaultValue="cod">
        <RadioGroupItem ref={ref} value="cod" data-testid="item-ref" />
      </RadioGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByTestId('item-ref'));
  });

  it('has the correct displayName from Radix Item', () => {
    expect(RadioGroupItem.displayName).toBe(
      RadioGroupPrimitive.Item.displayName,
    );
  });

  it('renders the Circle indicator icon only when checked', () => {
    render(
      <RadioGroup defaultValue="cod">
        <RadioGroupItem value="cod" data-testid="item-checked" />
        <RadioGroupItem value="bank" data-testid="item-unchecked" />
      </RadioGroup>,
    );

    const checkedItem = screen.getByTestId('item-checked');
    const uncheckedItem = screen.getByTestId('item-unchecked');

    expect(checkedItem).toHaveAttribute('aria-checked', 'true');
    expect(uncheckedItem).toHaveAttribute('aria-checked', 'false');

    // The checked item contains the SVG circle indicator
    const checkedSvg = checkedItem.querySelector('svg');
    expect(checkedSvg).toBeInTheDocument();
    expect(checkedSvg).toHaveClass(
      'h-2.5',
      'w-2.5',
      'fill-current',
      'text-current',
    );

    // The unchecked item does not contain the SVG circle indicator
    expect(uncheckedItem.querySelector('svg')).toBeNull();
  });

  it('calls onValueChange with the exact value when an unchecked item is clicked', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup defaultValue="cod" onValueChange={handleValueChange}>
        <RadioGroupItem value="cod" data-testid="radio-click-cod" />
        <RadioGroupItem value="banking" data-testid="radio-click-banking" />
      </RadioGroup>,
    );

    const bankingItem = screen.getByTestId('radio-click-banking');
    expect(bankingItem).toHaveAttribute('aria-checked', 'false');

    await user.click(bankingItem);

    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(handleValueChange).toHaveBeenCalledWith('banking');
    expect(bankingItem).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('radio-click-cod')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('does not trigger onValueChange when clicking an item that is disabled', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup defaultValue="cod" onValueChange={handleValueChange}>
        <RadioGroupItem value="cod" data-testid="radio-dis-cod" />
        <RadioGroupItem value="momo" disabled data-testid="radio-dis-momo" />
      </RadioGroup>,
    );

    const momoItem = screen.getByTestId('radio-dis-momo');
    expect(momoItem).toBeDisabled();
    expect(momoItem).toHaveAttribute('aria-checked', 'false');

    await user.click(momoItem);

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(momoItem).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('radio-dis-cod')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('respects disabled state when the entire RadioGroup is disabled', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup disabled defaultValue="cod" onValueChange={handleValueChange}>
        <RadioGroupItem value="cod" data-testid="radio-grp-dis-cod" />
        <RadioGroupItem value="bank" data-testid="radio-grp-dis-bank" />
      </RadioGroup>,
    );

    const codItem = screen.getByTestId('radio-grp-dis-cod');
    const bankItem = screen.getByTestId('radio-grp-dis-bank');

    expect(codItem).toBeDisabled();
    expect(bankItem).toBeDisabled();

    await user.click(bankItem);
    expect(handleValueChange).not.toHaveBeenCalled();
  });

  it('works as a controlled component with value and onValueChange', () => {
    function ControlledRadioGroup() {
      const [val, setVal] = React.useState('option1');
      return (
        <div>
          <span data-testid="current-value">{val}</span>
          <RadioGroup value={val} onValueChange={setVal}>
            <RadioGroupItem value="option1" data-testid="controlled-opt-1" />
            <RadioGroupItem value="option2" data-testid="controlled-opt-2" />
          </RadioGroup>
        </div>
      );
    }

    render(<ControlledRadioGroup />);

    expect(screen.getByTestId('current-value')).toHaveTextContent('option1');
    expect(screen.getByTestId('controlled-opt-1')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByTestId('controlled-opt-2')).toHaveAttribute(
      'aria-checked',
      'false',
    );

    fireEvent.click(screen.getByTestId('controlled-opt-2'));

    expect(screen.getByTestId('current-value')).toHaveTextContent('option2');
    expect(screen.getByTestId('controlled-opt-1')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByTestId('controlled-opt-2')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
