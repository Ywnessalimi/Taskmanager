import { cn } from "cn"
import { useId } from "react"

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  leftControl?: React.ReactNode
}

/** فیلد ورودی برچسب‌دار مشترک بین فرم ورود و ثبت‌نام — استایل مستقیم از طرح Figma. */
export function AuthField({ label, className, leftControl, id, ...inputProps }: AuthFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-[color:var(--auth-text-primary)]">{label}</label>
      <div className="relative w-full">
      <input
        dir="auto"
        id={inputId}
        {...inputProps}
        className={cn(
          "w-full rounded-[10px] border border-[var(--auth-border-secondary)] bg-[var(--auth-bg)] px-3 py-2.5 text-sm text-[color:var(--auth-text-primary)] shadow-[0_1px_2px_0_rgba(228,229,231,0.24)] outline-none placeholder:text-[color:var(--auth-text-quaternary)] focus:border-[var(--auth-brand)]",
          leftControl && "pl-12",
          className
        )}
      />
      {leftControl}
      </div>
    </div>
  )
}
