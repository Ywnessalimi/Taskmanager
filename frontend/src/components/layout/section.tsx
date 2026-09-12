export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-foreground">{children}</h2>
}

/** باکس با بوردر و پدینگ ۱۲px — الگوی مشترک بخش‌های Overview (سازمان و پروژه). */
export function SectionBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-border bg-background p-3">{children}</div>
}
