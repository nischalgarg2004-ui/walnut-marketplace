type OnboardingProgressDotsProps = {
  total: number;
  current: number;
};

export function OnboardingProgressDots({ total, current }: OnboardingProgressDotsProps) {
  return (
    <div className="progress-dots" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, index) => {
        const state = index < current ? "complete" : index === current ? "active" : "";
        return <span key={index} className={`progress-dot ${state}`.trim()} aria-hidden />;
      })}
    </div>
  );
}
