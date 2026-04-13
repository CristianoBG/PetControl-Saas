import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number; // value in reais (e.g. 15.50)
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

function formatCentsToDisplay(cents: number): string {
  if (cents === 0) return "";
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  const centavosStr = centavos.toString().padStart(2, "0");
  return `${reaisStr},${centavosStr}`;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, placeholder = "R$ 0,00", disabled }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      const cents = Math.round(value * 100);
      return cents > 0 ? `R$ ${formatCentsToDisplay(cents)}` : "";
    });

    // Sync display when value changes externally
    React.useEffect(() => {
      const cents = Math.round(value * 100);
      if (cents === 0 && displayValue === "") return;
      const expected = cents > 0 ? `R$ ${formatCentsToDisplay(cents)}` : "";
      // Only update if value actually changed (avoid cursor issues)
      const currentCents = parseCents(displayValue);
      if (currentCents !== cents) {
        setDisplayValue(expected);
      }
    }, [value]);

    function parseCents(str: string): number {
      return parseInt(str.replace(/\D/g, "") || "0", 10);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = e.target.value.replace(/\D/g, "");
      const cents = parseInt(rawDigits || "0", 10);

      if (cents === 0) {
        setDisplayValue("");
        onChange(0);
        return;
      }

      const formatted = `R$ ${formatCentsToDisplay(cents)}`;
      setDisplayValue(formatted);
      onChange(cents / 100);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
