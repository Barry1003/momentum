import { cn } from "../lib/cn";

export interface ChipProps {
  id: string;
  name: string;
  label: string;
  value: string;
  type: "radio" | "checkbox";
  checked: boolean;
  busy?: boolean;
  onChange: (value: string, checked: boolean) => void;
}

export function Chip({ id, name, label, value, type, checked, busy = false, onChange }: ChipProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer select-none items-center rounded-chip border border-outline bg-surface px-4 py-2 font-heading text-label font-bold text-text transition-[background,color,box-shadow] duration-150 ease-out",
        "has-checked:border-transparent has-checked:bg-[image:var(--gradient-primary)] has-checked:text-white has-checked:shadow-pressable",
        "has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-accent has-focus-visible:outline-offset-2",
        busy && "pointer-events-none opacity-45",
      )}
    >
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={busy}
        onChange={(event) => onChange(value, event.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
