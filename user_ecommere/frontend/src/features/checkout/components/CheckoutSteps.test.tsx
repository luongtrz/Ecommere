import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CheckoutSteps } from './CheckoutSteps';

describe('CheckoutSteps', () => {
  const getStepElements = (container: HTMLElement) => {
    const root = container.firstChild as HTMLElement;
    const stepElements = Array.from(root.children) as HTMLElement[];
    return stepElements.map((el) => {
      const circle = el.querySelector(
        'div.flex-col .rounded-full',
      ) as HTMLElement;
      const label = el.querySelector('div.flex-col > span') as HTMLElement;
      const connector = el.querySelector('.bg-slate-200') as HTMLElement | null;
      const connectorFill = el.querySelector(
        '.bg-slate-200 > div',
      ) as HTMLElement | null;
      return { container: el, circle, label, connector, connectorFill };
    });
  };

  it('renders all step labels in Vietnamese and proper container layout', () => {
    const { container } = render(<CheckoutSteps currentStep={1} />);

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'w-full',
      'max-w-xl',
      'mx-auto',
      'py-2',
    );

    expect(screen.getByText('Vận chuyển')).toBeInTheDocument();
    expect(screen.getByText('Thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận')).toBeInTheDocument();

    const steps = getStepElements(container);
    expect(steps).toHaveLength(3);

    // There should be connector lines after step 1 and step 2, but not step 3
    expect(steps[0].connector).toBeInTheDocument();
    expect(steps[1].connector).toBeInTheDocument();
    expect(steps[2].connector).toBeNull();
    expect(container.querySelectorAll('.bg-slate-200')).toHaveLength(2);
  });

  it('renders step 1 as active and steps 2 and 3 as pending when currentStep is 1', () => {
    const { container } = render(<CheckoutSteps currentStep={1} />);
    const [step1, step2, step3] = getStepElements(container);

    // Step 1: Current
    expect(within(step1.circle).getByText('1')).toBeInTheDocument();
    expect(step1.circle.querySelector('svg')).toBeNull();
    expect(step1.circle).toHaveClass(
      'bg-teal-600',
      'text-white',
      'ring-4',
      'ring-teal-50',
      'shadow-sm',
    );
    expect(step1.circle).not.toHaveClass(
      'bg-slate-100',
      'text-slate-400',
      'border-slate-200',
    );
    expect(step1.label).toHaveClass('text-teal-700', 'font-semibold');
    expect(step1.label).not.toHaveClass('text-slate-800', 'text-slate-400');
    expect(step1.connectorFill).toHaveClass('scale-x-0');
    expect(step1.connectorFill).not.toHaveClass('scale-x-100');

    // Step 2: Pending
    expect(within(step2.circle).getByText('2')).toBeInTheDocument();
    expect(step2.circle.querySelector('svg')).toBeNull();
    expect(step2.circle).toHaveClass(
      'bg-slate-100',
      'border',
      'border-slate-200',
      'text-slate-400',
    );
    expect(step2.circle).not.toHaveClass('bg-teal-600', 'text-white');
    expect(step2.label).toHaveClass('text-slate-400');
    expect(step2.label).not.toHaveClass('text-teal-700', 'text-slate-800');
    expect(step2.connectorFill).toHaveClass('scale-x-0');
    expect(step2.connectorFill).not.toHaveClass('scale-x-100');

    // Step 3: Pending
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();
    expect(step3.circle.querySelector('svg')).toBeNull();
    expect(step3.circle).toHaveClass(
      'bg-slate-100',
      'border',
      'border-slate-200',
      'text-slate-400',
    );
    expect(step3.circle).not.toHaveClass('bg-teal-600', 'text-white');
    expect(step3.label).toHaveClass('text-slate-400');
    expect(step3.label).not.toHaveClass('text-teal-700', 'text-slate-800');
    expect(step3.connector).toBeNull();
  });

  it('renders step 1 as completed, step 2 as active, and step 3 as pending when currentStep is 2', () => {
    const { container } = render(<CheckoutSteps currentStep={2} />);
    const [step1, step2, step3] = getStepElements(container);

    // Step 1: Completed
    expect(within(step1.circle).queryByText('1')).toBeNull();
    const checkIcon = step1.circle.querySelector('svg.lucide-check-circle');
    expect(checkIcon).toBeInTheDocument();
    expect(checkIcon).toHaveClass('h-5', 'w-5');
    expect(step1.circle).toHaveClass('bg-teal-600', 'text-white', 'shadow-sm');
    expect(step1.circle).not.toHaveClass(
      'ring-teal-50',
      'bg-slate-100',
      'text-slate-400',
    );
    expect(step1.label).toHaveClass('text-slate-800', 'font-medium');
    expect(step1.label).not.toHaveClass('text-teal-700', 'text-slate-400');
    expect(step1.connectorFill).toHaveClass('scale-x-100');
    expect(step1.connectorFill).not.toHaveClass('scale-x-0');

    // Step 2: Current
    expect(within(step2.circle).getByText('2')).toBeInTheDocument();
    expect(step2.circle.querySelector('svg')).toBeNull();
    expect(step2.circle).toHaveClass(
      'bg-teal-600',
      'ring-4',
      'ring-teal-50',
      'text-white',
      'shadow-sm',
    );
    expect(step2.label).toHaveClass('text-teal-700', 'font-semibold');
    expect(step2.label).not.toHaveClass('text-slate-800', 'text-slate-400');
    expect(step2.connectorFill).toHaveClass('scale-x-0');
    expect(step2.connectorFill).not.toHaveClass('scale-x-100');

    // Step 3: Pending
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();
    expect(step3.circle.querySelector('svg')).toBeNull();
    expect(step3.circle).toHaveClass(
      'bg-slate-100',
      'border',
      'border-slate-200',
      'text-slate-400',
    );
    expect(step3.label).toHaveClass('text-slate-400');
  });

  it('renders step 1 and step 2 as completed and step 3 as active when currentStep is 3', () => {
    const { container } = render(<CheckoutSteps currentStep={3} />);
    const [step1, step2, step3] = getStepElements(container);

    // Step 1: Completed
    expect(
      step1.circle.querySelector('svg.lucide-check-circle'),
    ).toBeInTheDocument();
    expect(step1.circle).toHaveClass('bg-teal-600', 'text-white', 'shadow-sm');
    expect(step1.label).toHaveClass('text-slate-800');
    expect(step1.connectorFill).toHaveClass('scale-x-100');

    // Step 2: Completed
    expect(within(step2.circle).queryByText('2')).toBeNull();
    expect(
      step2.circle.querySelector('svg.lucide-check-circle'),
    ).toBeInTheDocument();
    expect(step2.circle).toHaveClass('bg-teal-600', 'text-white', 'shadow-sm');
    expect(step2.circle).not.toHaveClass(
      'ring-teal-50',
      'bg-slate-100',
      'text-slate-400',
    );
    expect(step2.label).toHaveClass('text-slate-800');
    expect(step2.label).not.toHaveClass('text-teal-700', 'text-slate-400');
    expect(step2.connectorFill).toHaveClass('scale-x-100');
    expect(step2.connectorFill).not.toHaveClass('scale-x-0');

    // Step 3: Current
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();
    expect(step3.circle.querySelector('svg')).toBeNull();
    expect(step3.circle).toHaveClass(
      'bg-teal-600',
      'ring-4',
      'ring-teal-50',
      'text-white',
      'shadow-sm',
    );
    expect(step3.label).toHaveClass('text-teal-700');
    expect(step3.label).not.toHaveClass('text-slate-800', 'text-slate-400');
  });

  it('renders all steps as completed when currentStep is greater than 3', () => {
    const { container } = render(<CheckoutSteps currentStep={4} />);
    const [step1, step2, step3] = getStepElements(container);

    // All steps show checkmark icons
    expect(container.querySelectorAll('svg.lucide-check-circle')).toHaveLength(
      3,
    );
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.queryByText('3')).toBeNull();

    // All step circles and labels have completed styles
    [step1, step2, step3].forEach((step) => {
      expect(step.circle).toHaveClass('bg-teal-600', 'text-white', 'shadow-sm');
      expect(step.circle).not.toHaveClass('ring-teal-50', 'bg-slate-100');
      expect(step.label).toHaveClass('text-slate-800');
      expect(step.label).not.toHaveClass('text-teal-700', 'text-slate-400');
    });

    // Both connectors are filled
    expect(step1.connectorFill).toHaveClass('scale-x-100');
    expect(step2.connectorFill).toHaveClass('scale-x-100');
  });

  it('renders all steps as pending when currentStep is 0', () => {
    const { container } = render(<CheckoutSteps currentStep={0} />);
    const [step1, step2, step3] = getStepElements(container);

    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(within(step1.circle).getByText('1')).toBeInTheDocument();
    expect(within(step2.circle).getByText('2')).toBeInTheDocument();
    expect(within(step3.circle).getByText('3')).toBeInTheDocument();

    [step1, step2, step3].forEach((step) => {
      expect(step.circle).toHaveClass(
        'bg-slate-100',
        'border',
        'border-slate-200',
        'text-slate-400',
      );
      expect(step.circle).not.toHaveClass('bg-teal-600', 'text-white');
      expect(step.label).toHaveClass('text-slate-400');
      expect(step.label).not.toHaveClass('text-teal-700', 'text-slate-800');
    });

    expect(step1.connectorFill).toHaveClass('scale-x-0');
    expect(step2.connectorFill).toHaveClass('scale-x-0');
  });
});
