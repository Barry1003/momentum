"use client";

import { useId } from "react";
import { Chip } from "./Chip";
import { cn } from "../lib/cn";

export interface ChipOption {
  value: string;
  label: string;
  busy?: boolean;
}

interface ChipGroupBaseProps {
  legend: string;
  hideLegend?: boolean;
  options: ChipOption[];
  className?: string;
}

interface SingleChipGroupProps extends ChipGroupBaseProps {
  mode: "single";
  value: string | null;
  onChange: (value: string) => void;
}

interface MultiChipGroupProps extends ChipGroupBaseProps {
  mode: "multi";
  value: string[];
  onChange: (value: string[]) => void;
}

export type ChipGroupProps = SingleChipGroupProps | MultiChipGroupProps;

export function ChipGroup(props: ChipGroupProps) {
  const { legend, hideLegend = false, options, className } = props;
  const groupId = useId();
  const name = `chip-group-${groupId}`;

  return (
    <fieldset className={cn("flex flex-wrap gap-2 border-0 p-0 m-0", className)}>
      <legend className={hideLegend ? "sr-only" : "mb-2 w-full font-heading text-label font-bold"}>
        {legend}
      </legend>
      {options.map((option) => {
        if (props.mode === "single") {
          return (
            <Chip
              key={option.value}
              id={`${name}-${option.value}`}
              name={name}
              type="radio"
              label={option.label}
              value={option.value}
              busy={option.busy}
              checked={props.value === option.value}
              onChange={(value) => props.onChange(value)}
            />
          );
        }
        return (
          <Chip
            key={option.value}
            id={`${name}-${option.value}`}
            name={`${name}-${option.value}`}
            type="checkbox"
            label={option.label}
            value={option.value}
            busy={option.busy}
            checked={props.value.includes(option.value)}
            onChange={(value, checked) => {
              const next = checked
                ? [...props.value, value]
                : props.value.filter((item) => item !== value);
              props.onChange(next);
            }}
          />
        );
      })}
    </fieldset>
  );
}
