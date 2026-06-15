import * as React from "react";

import { getTodayDateInputValue } from "@/lib/dateGuards";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const guardedProps =
      type === "date"
        ? {
            ...props,
            min: props.min && String(props.min) > getTodayDateInputValue() ? props.min : getTodayDateInputValue(),
            onInput: (event: React.InputEvent<HTMLInputElement>) => {
              const input = event.currentTarget;
              const today = getTodayDateInputValue();
              const min = props.min && String(props.min) > today ? String(props.min) : today;
              if (input.value && input.value < min) input.value = min;
              props.onInput?.(event);
            },
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              const input = event.currentTarget;
              const today = getTodayDateInputValue();
              const min = props.min && String(props.min) > today ? String(props.min) : today;
              if (input.value && input.value < min) input.value = min;
              props.onChange?.(event);
            },
          }
        : props;

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...guardedProps}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
