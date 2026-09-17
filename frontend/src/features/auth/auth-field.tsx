import { cn } from "cn"

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

/** فیلد ورودی برچسب‌دار مشترک بین فرم ورود و ثبت‌نام — استایل مستقیم از طرح Figma. */
export function AuthField({ label, className, ...inputProps }: AuthFieldProps) {
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="text-sm font-medium text-[color:var(--auth-text-primary)]">{label}</span>
      <input
        dir="auto"
        {...inputProps}
        className={cn(
          "w-full rounded-[10px] border border-[var(--auth-border-secondary)] bg-[var(--auth-bg)] px-3 py-2.5 text-sm text-[color:var(--auth-text-primary)] shadow-[0_1px_2px_0_rgba(228,229,231,0.24)] outline-none placeholder:text-[color:var(--auth-text-quaternary)] focus:border-[var(--auth-brand)]",
          className
        )}
      />
    </label>
  )
}
