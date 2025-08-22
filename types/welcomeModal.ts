export type ActualWizardProps = {
  ref: React.RefObject<any>;
  steps: Array<{ content: React.ReactElement }>;
  isFirstStep: (val: boolean) => void;
  isLastStep: (val: boolean) => void;
  onNext: (step: number) => void;
  onPrev: (step: number) => void;
  currentStep: (data: { currentStep: number; isLastStep: boolean; isFirstStep: boolean }) => void;
};

export interface OnboardingStepProps {
    wizardRef?: React.RefObject<any>;
    onMessageSent?: () => void
  }

export type WelcomeModalProps = {
    isVisible: boolean;
    onClose: () => void;
  };

export type WelcomeStepProps = {
    onNext: () => void;
  };
  