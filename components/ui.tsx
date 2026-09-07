import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link, { LinkProps } from "next/link";
import clsx from "clsx";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center gap-1 text-sm font-medium text-navy"
      >
        {label}
        {required && <span className="text-coral">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}

const controlClass =
  "w-full rounded-lg border border-navy/20 bg-white px-3.5 py-2.5 text-foreground focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 disabled:bg-black/5";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(controlClass, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(controlClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(controlClass, "bg-white", props.className)} />;
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm has-checked:border-coral has-checked:bg-coral/5">
      <input type="checkbox" {...props} className="h-4 w-4 accent-coral" />
      {label}
    </label>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants: Record<string, string> = {
    primary: "bg-coral text-white hover:opacity-90",
    secondary: "bg-navy text-white hover:opacity-90",
    danger: "bg-white text-coral border border-coral hover:bg-coral/10",
    ghost: "bg-transparent text-navy border border-navy/20 hover:bg-navy/5",
  };
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:opacity-50",
        variants[variant],
        className,
      )}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: LinkProps & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const variants: Record<string, string> = {
    primary: "bg-coral text-white hover:opacity-90",
    secondary: "bg-navy text-white hover:opacity-90",
    danger: "bg-white text-coral border border-coral hover:bg-coral/10",
    ghost: "bg-transparent text-navy border border-navy/20 hover:bg-navy/5",
  };
  return (
    <Link
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold transition",
        variants[variant],
        className,
      )}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-navy/10 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  navy: "bg-navy/10 text-navy",
  coral: "bg-coral/10 text-coral",
  gold: "bg-gold/15 text-[#8a6a30]",
  gray: "bg-black/5 text-foreground/60",
  green: "bg-emerald-100 text-emerald-700",
};

export function Badge({
  color = "navy",
  children,
}: {
  color?: keyof typeof badgeColors;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        badgeColors[color],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-foreground/60">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
