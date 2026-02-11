import Link from "next/link";

export function Container({ children }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

export function Button({ children, href, variant="primary", className="", ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition shadow-soft";
  const styles = {
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    secondary: "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50",
    danger: "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50",
  };
  const cn = `${base} ${styles[variant] || styles.primary} ${className}`;
  if (href) return <Link href={href} className={cn}>{children}</Link>;
  return <button className={cn} {...props}>{children}</button>;
}

export function Card({ children }) {
  return <div className="rounded-3xl border border-gray-200 bg-white shadow-soft overflow-hidden">{children}</div>;
}

export function CardBody({ children }) {
  return <div className="p-4">{children}</div>;
}

export function Badge({ children }) {
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{children}</span>;
}

export function Input({
  value,
  defaultValue,
  onChange,
  readOnly,
  ...rest
}) {
  const isControlled = value !== undefined;

  return (
    <input
      {...rest}
      value={isControlled ? value : undefined}
      defaultValue={!isControlled ? defaultValue : undefined}
      onChange={onChange}
      readOnly={readOnly || (isControlled && !onChange)}
      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
    />
  );
}



export function Textarea(props) {
  const { value, onChange, readOnly, className = "", ...rest } = props;

  const hasValue = value !== undefined;
  const finalReadOnly = readOnly || (hasValue && !onChange);

  // إذا في value ومافي onChange -> خليه uncontrolled لتفادي التحذير
  if (hasValue && !onChange && !readOnly) {
    const { value: _v, ...r } = props;
    return (
      <textarea
        {...r}
        defaultValue={value ?? ""}
        className={
          "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 " +
          className
        }
      />
    );
  }
  return (
    <textarea
      {...rest}
      value={hasValue ? value ?? "" : undefined}
      onChange={onChange}
      readOnly={finalReadOnly}
      className={
        "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 " +
        className
      }
    />
  );
}

