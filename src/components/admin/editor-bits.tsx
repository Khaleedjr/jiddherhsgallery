export function ChevronLeftFallback({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}
