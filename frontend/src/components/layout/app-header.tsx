/**
 * هدر صفحه‌های اصلی تب‌ها (خانه، تسک‌های من، اعلان‌ها، حساب کاربری).
 *
 * برخلاف محتوای صفحه که روی پس‌زمینه‌ی `bg2` می‌نشیند، هدر سفید (`bg-background`) است و
 * تمام‌عرض — پس نباید داخل کانتینر دارای padding صفحه قرار بگیرد. صفحه‌های جزئیات
 * (سازمان، پروژه، تسک جدید) به‌جای این از `components/navigation/PageHeader` استفاده
 * می‌کنند که دکمه‌ی بازگشت و منوی سه‌نقطه هم دارد.
 */
export function AppHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="flex h-13 items-center gap-2 border-b border-border bg-background px-4">
      <h1 className="min-w-0 flex-1 truncate text-base font-medium text-foreground">{title}</h1>
      {action}
    </header>
  )
}
