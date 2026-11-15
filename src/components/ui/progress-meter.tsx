type ProgressMeterProps = { value: number; label: string };

export function ProgressMeter({ value, label }: ProgressMeterProps) {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div aria-label={label} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={bounded} className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${bounded}%` }} />
    </div>
  );
}
