import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  className = "",
}: StepIndicatorProps) {
  return (
    <div
      className={`flex items-center ${className}`}
      data-ocid="step_indicator"
    >
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <div
            key={step.id}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center gap-1">
              <div
                data-ocid={`step_indicator.step.${step.id}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-smooth ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground border-2 border-border"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap hidden sm:block ${
                  isActive
                    ? "text-primary"
                    : isUpcoming
                      ? "text-muted-foreground"
                      : "text-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 sm:mb-0 transition-smooth ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
