export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-foreground">{children}</h2>
}

/** باکس با بوردر و پدینگ ۱۲px — الگوی مشترک بخش‌های Overview (سازمان و پروژه). */
export function SectionBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-border bg-background p-3">{children}</div>
}

/**
 * کارت خودکفا با عنوان + زیرعنوان داخل بوردر (طرح Figma «AlignUI» بخش‌های Deadline Calendar،
 * Task Status Distribution و Member Activity در نمای‌کلی پروژه) — برخلاف `SectionTitle`+`SectionBox`
 * که عنوان بیرون از باکس است، اینجا عنوان/زیرعنوان و محتوا هر دو داخل همان باکس‌اند.
 */
export function OverviewCard({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-background p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-text2">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
