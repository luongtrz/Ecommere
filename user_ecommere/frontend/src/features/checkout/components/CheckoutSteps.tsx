import { Check } from 'lucide-react';

interface CheckoutStepsProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { id: 1, label: 'Vận chuyển' },
  { id: 2, label: 'Thanh toán' },
  { id: 3, label: 'Xác nhận' },
];

export function CheckoutSteps({
  currentStep,
  onStepClick,
}: CheckoutStepsProps) {
  return (
    <nav
      aria-label="Tiến trình thanh toán"
      className="w-full max-w-xl mx-auto px-2"
    >
      <ol className="flex items-center justify-between relative">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted && typeof onStepClick === 'function';

          const stepCircle = (
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold tabular shrink-0 transition-colors
                ${isCurrent ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                ${isCompleted ? 'bg-success text-success-foreground' : ''}
                ${!isCurrent && !isCompleted ? 'border border-border text-muted-foreground bg-card' : ''}
              `}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <span>{step.id}</span>
              )}
            </div>
          );

          const stepLabel = (
            <span
              className={`
                text-xs sm:text-sm font-medium transition-colors text-center
                ${isCurrent ? 'text-foreground font-semibold' : ''}
                ${isCompleted ? 'text-foreground/90' : ''}
                ${!isCurrent && !isCompleted ? 'text-muted-foreground' : ''}
              `}
            >
              {step.label}
            </span>
          );

          return (
            <li
              key={step.id}
              className={`relative flex flex-col items-center flex-1 ${
                index < STEPS.length - 1 ? 'pr-2' : ''
              }`}
            >
              {/* Connector line between steps */}
              {index < STEPS.length - 1 && (
                <div
                  data-testid="step-connector"
                  className={`
                    absolute top-5 left-[calc(50%+18px)] right-[calc(-50%+18px)] h-0.5 -translate-y-1/2 z-0 transition-colors
                    ${currentStep > step.id ? 'bg-primary' : 'bg-border'}
                  `}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator: clickable button if completed and handler provided, else static div */}
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className="group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 min-h-11 min-w-11 cursor-pointer z-10"
                  aria-label={`Quay lại bước ${step.id}: ${step.label}`}
                >
                  {stepCircle}
                  {stepLabel}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-1 min-h-11 min-w-11 z-10">
                  {stepCircle}
                  {stepLabel}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
