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
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center gap-2 relative">
                            <div
                                className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${isCurrent
                            ? 'bg-primary text-primary-foreground ring-4 ring-secondary shadow-luxury'
                            : isCompleted
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted/60 text-muted-foreground border border-border/80'
                        }
                    `}
                            >
                                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <span className="font-serif font-bold text-xs">{step.id}</span>}
                            </div>
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                                isCurrent ? 'text-foreground font-extrabold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < STEPS.length - 1 && (
                            <div className="flex-1 h-0.5 mx-3 md:mx-4 rounded-full overflow-hidden bg-border/80 relative">
                                <div
                                    className={`absolute inset-0 bg-primary transition-transform duration-500 ease-in-out origin-left ${currentStep > step.id ? 'scale-x-100' : 'scale-x-0'}`}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
