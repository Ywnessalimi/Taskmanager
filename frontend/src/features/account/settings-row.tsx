import { RemixIcon } from "@/components/ui/remix-icon"

/**
 * ردیف‌های تکرارشونده‌ی صفحه‌ی حساب کاربری. هر گروه ردیف داخل یک SettingsGroup می‌نشیند
 * (بوردر دور گروه، جداکننده‌ی ظریف بین ردیف‌ها) — مطابق فشردگی و بی‌سایه بودنِ docs/DESIGN.md.
 */
export function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col rounded-md border border-border bg-background">{children}</div>
}

const ROW_BASE =
  "flex w-full items-center gap-2.5 border-b border-border px-3 py-2.5 text-start last:border-b-0"

/** ردیف قابل کلیک (با فلش انتهایی). اگر onClick نداشته باشد، غیرفعال و کم‌رنگ رندر می‌شود. */
export function SettingsLinkRow({
  icon,
  label,
  value,
  destructive,
  onClick,
}: {
  icon: string
  label: string
  value?: string
  destructive?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`${ROW_BASE} enabled:hover:bg-bg2 disabled:cursor-default disabled:opacity-60`}
    >
      <RemixIcon
        name={icon}
        className={`text-base ${destructive ? "text-destructive" : "text-icon2"}`}
      />
      <span className={`flex-1 text-sm ${destructive ? "text-destructive" : "text-foreground"}`}>
        {label}
      </span>
      {value && <span className="text-xs text-text2">{value}</span>}
      {!destructive && onClick && (
        <RemixIcon name="arrow-left-s-line" className="text-base text-icon2" />
      )}
    </button>
  )
}

/** ردیف تنظیمات با کنترل دلخواه در انتها (معمولاً Switch). */
export function SettingsToggleRow({
  icon,
  label,
  description,
  control,
}: {
  icon: string
  label: string
  description?: string
  control: React.ReactNode
}) {
  return (
    <div className={ROW_BASE}>
      <RemixIcon name={icon} className="text-base text-icon2" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-text2">{description}</p>}
      </div>
      {control}
    </div>
  )
}
