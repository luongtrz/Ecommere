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
        <div className="flex items-center justify-center mb-8 w-full max-w-xl mx-auto">
            {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center gap-2 relative">
                            <div
                                className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                        ${isCompleted ? 'bg-emerald-600 shadow-emerald-100' : isCurrent ? 'bg-primary shadow-primary/20 ring-4 ring-secondary' : 'bg-gray-100 border-2 border-gray-200'}
                        ${(isCompleted || isCurrent) ? 'text-white shadow-lg' : 'text-gray-400'}
                    `}
                            >
                                {isCompleted ? <CheckCircle className="h-6 w-6" /> : <span className="font-bold">{step.id}</span>}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < STEPS.length - 1 && (
                            <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-gray-100 relative">
                                <div
                                    className={`absolute inset-0 bg-primary transition-transform duration-700 ease-in-out origin-left ${currentStep > step.id ? 'scale-x-100' : 'scale-x-0'}`}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
