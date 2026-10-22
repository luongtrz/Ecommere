import { CheckCircle } from 'lucide-react';

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
    <div className="flex items-center justify-center w-full max-w-xl mx-auto py-2">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;

        return (
          <div
            key={step.id}
            className="flex items-center flex-1 last:flex-none"
          >
            {/* Step Circle */}
            <div className="flex flex-col items-center gap-1.5 relative">
              <div
                className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200
                  ${
                    isCurrent
                      ? 'bg-teal-600 text-white ring-4 ring-teal-50 shadow-sm'
                      : isCompleted
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <span className="font-sans font-semibold text-xs">
                    {step.id}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs transition-colors duration-200 ${
                  isCurrent
                    ? 'text-teal-700 font-semibold'
                    : isCompleted
                      ? 'text-slate-800 font-medium'
                      : 'text-slate-400 font-normal'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 sm:mx-4 rounded-full overflow-hidden bg-slate-200 relative mb-5">
                <div
                  className={`absolute inset-0 bg-teal-600 transition-transform duration-300 ease-in-out origin-left ${currentStep > step.id ? 'scale-x-100' : 'scale-x-0'}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
