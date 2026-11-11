import { Check } from 'lucide-react';

interface CheckoutStepsProps {
  currentStep: number;
}

const STEPS = [
  { id: 1, label: 'Vận chuyển' },
  { id: 2, label: 'Thanh toán' },
  { id: 3, label: 'Xác nhận' },
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <nav aria-label="Tiến trình thanh toán" className="w-full max-w-xl mx-auto">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <li
              key={step.id}
              className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex items-center gap-2.5 shrink-0">
                {/* 28px circle */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium tabular shrink-0 transition-colors
                    ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                    ${isCompleted ? 'bg-success text-success-foreground' : ''}
                    ${!isCurrent && !isCompleted ? 'border border-border text-muted-foreground bg-card' : ''}
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Label text-sm; collapses to numbers + current label on mobile */}
                <span
                  className={`text-sm ${
                    isCurrent
                      ? 'font-medium text-foreground inline'
                      : 'text-muted-foreground hidden sm:inline'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* 1px hairline connector */}
              {index < STEPS.length - 1 && (
                <div
                  className="h-px bg-border flex-1 mx-3 sm:mx-4"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
