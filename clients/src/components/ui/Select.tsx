import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, id, className, children, ...props }, ref) => (
  <div>
    {label && <label htmlFor={id} className="label">{label}</label>}
    <select ref={ref} id={id} className={clsx("input", className)} {...props}>
      {children}
    </select>
  </div>
));
Select.displayName = "Select";
