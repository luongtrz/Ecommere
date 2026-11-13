import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutSteps } from './CheckoutSteps';

describe('CheckoutSteps', () => {
  const getStepElements = (container: HTMLElement) => {
    const listItems = Array.from(
      container.querySelectorAll('ol > li'),
    ) as HTMLElement[];
    return listItems.map((el) => {
      const circle = el.querySelector('.rounded-full') as HTMLElement;
      const label = el.querySelector(
        'span.text-xs, span.sm\\:text-sm',
      ) as HTMLElement;
      const connector = el.querySelector(
        '[data-testid="step-connector"]',
      ) as HTMLElement | null;
      const button = el.querySelector('button') as HTMLButtonElement | null;
      return { container: el, circle, label, connector, button };
    });
  };

  it('renders all step labels in Vietnamese and proper container layout', () => {
    const { container } = render(<CheckoutSteps currentStep={1} />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Tiến trình thanh toán');

    expect(screen.getByText('Vận chuyển')).toBeInTheDocument();
    expect(screen.getByText('Thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận')).toBeInTheDocument();

    const steps = getStepElements(container);
    expect(steps).toHaveLength(3);

    // There should be connector lines after step 1 and step 2, but not step 3
    expect(steps[0].connector).toBeInTheDocument();
    expect(steps[1].connector).toBeInTheDocument();
    expect(steps[2].connector).toBeNull();
  });

  it('renders step 1 as active and steps 2 and 3 as pending when currentStep is 1', () => {
    const { container } = render(<CheckoutSteps currentStep={1} />);
    const [step1, step2, step3] = getStepElements(container);

    // Step 1: Current
    expect(within(step1.circle).getByText('1')).toBeInTheDocument();
    expect(step1.circle.querySelector('svg')).toBeNull();
    expect(step1.circle).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(step1.circle).toHaveAttribute('aria-current', 'step');
    expect(step1.label).toHaveClass('text-foreground', 'font-semibold');
    expect(step1.connector).toHaveClass('bg-border');

    // Step 2: Pending
    expect(within(step2.circle).getByText('2')).toBeInTheDocument();
    expect(step2.circle.querySelector('svg')).toBeNull();
    expect(step2.circle).toHaveClass('border-border', 'text-muted-foreground');
    expect(step2.circle).not.toHaveAttribute('aria-current');
    expect(step2.label).toHaveClass('text-muted-foreground');
    expect(step2.connector).toHaveClass('bg-border');

    // Step 3: Pending
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();
    expect(step3.circle.querySelector('svg')).toBeNull();
    expect(step3.circle).toHaveClass('border-border', 'text-muted-foreground');
    expect(step3.label).toHaveClass('text-muted-foreground');
    expect(step3.connector).toBeNull();
  });

  it('renders step 1 as completed, step 2 as active, and step 3 as pending when currentStep is 2', () => {
    const { container } = render(<CheckoutSteps currentStep={2} />);
    const [step1, step2, step3] = getStepElements(container);

    // Step 1: Completed
    expect(within(step1.circle).queryByText('1')).toBeNull();
    const checkIcon = step1.circle.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
    expect(step1.circle).toHaveClass('bg-success', 'text-success-foreground');
    expect(step1.circle).not.toHaveAttribute('aria-current');
    expect(step1.label).toHaveClass('text-foreground/90');
    expect(step1.connector).toHaveClass('bg-primary');

    // Step 2: Current
    expect(within(step2.circle).getByText('2')).toBeInTheDocument();
    expect(step2.circle.querySelector('svg')).toBeNull();
    expect(step2.circle).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(step2.circle).toHaveAttribute('aria-current', 'step');
    expect(step2.label).toHaveClass('text-foreground', 'font-semibold');
    expect(step2.connector).toHaveClass('bg-border');

    // Step 3: Pending
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();
    expect(step3.circle.querySelector('svg')).toBeNull();
    expect(step3.circle).toHaveClass('border-border', 'text-muted-foreground');
    expect(step3.label).toHaveClass('text-muted-foreground');
  });

  it('renders step 1 and step 2 as completed and step 3 as active when currentStep is 3', () => {
    const { container } = render(<CheckoutSteps currentStep={3} />);
    const [step1, step2, step3] = getStepElements(container);

    // Step 1: Completed
    expect(step1.circle.querySelector('svg')).toBeInTheDocument();
    expect(step1.circle).toHaveClass('bg-success', 'text-success-foreground');
    expect(step1.connector).toHaveClass('bg-primary');

    // Step 2: Completed
    expect(within(step2.circle).queryByText('2')).toBeNull();
    expect(step2.circle.querySelector('svg')).toBeInTheDocument();
    expect(step2.circle).toHaveClass('bg-success', 'text-success-foreground');
    expect(step2.connector).toHaveClass('bg-primary');

    // Step 3: Current
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();
    expect(step3.circle.querySelector('svg')).toBeNull();
    expect(step3.circle).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(step3.circle).toHaveAttribute('aria-current', 'step');
    expect(step3.label).toHaveClass('text-foreground', 'font-semibold');
  });

  it('renders all steps as completed when currentStep is greater than 3', () => {
    const { container } = render(<CheckoutSteps currentStep={4} />);
    const [step1, step2, step3] = getStepElements(container);

    // All steps show checkmark icons
    expect(container.querySelectorAll('svg')).toHaveLength(3);
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.queryByText('3')).toBeNull();

    // All step circles have completed styles
    [step1, step2, step3].forEach((step) => {
      expect(step.circle).toHaveClass('bg-success', 'text-success-foreground');
    });

    // Both connectors are filled with primary
    expect(step1.connector).toHaveClass('bg-primary');
    expect(step2.connector).toHaveClass('bg-primary');
  });

  it('renders all steps as pending when currentStep is 0', () => {
    const { container } = render(<CheckoutSteps currentStep={0} />);
    const [step1, step2, step3] = getStepElements(container);

    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(within(step1.circle).getByText('1')).toBeInTheDocument();
    expect(within(step2.circle).getByText('2')).toBeInTheDocument();
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();

    [step1, step2, step3].forEach((step) => {
      expect(step.circle).toHaveClass('border-border', 'text-muted-foreground');
      expect(step.label).toHaveClass('text-muted-foreground');
    });

    expect(step1.connector).toHaveClass('bg-border');
    expect(step2.connector).toHaveClass('bg-border');
  });

  it('allows clicking completed steps when onStepClick is provided', async () => {
    const user = userEvent.setup();
    const handleStepClick = vi.fn();

    const { container } = render(
      <CheckoutSteps currentStep={3} onStepClick={handleStepClick} />,
    );
    const [step1, step2, step3] = getStepElements(container);

    // Steps 1 and 2 are buttons
    expect(step1.button).toBeInTheDocument();
    expect(step2.button).toBeInTheDocument();
    expect(step3.button).toBeNull();

    expect(
      screen.getByRole('button', { name: 'Quay lại bước 1: Vận chuyển' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Quay lại bước 2: Thanh toán' }),
    ).toBeInTheDocument();

    await user.click(step1.button!);
    expect(handleStepClick).toHaveBeenCalledWith(1);

    await user.click(step2.button!);
    expect(handleStepClick).toHaveBeenCalledWith(2);
  });
});
