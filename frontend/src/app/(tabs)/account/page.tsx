import { Button } from "@/components/ui/button"
import { RemixIcon } from "@/components/ui/remix-icon"

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-base font-medium text-foreground">حساب کاربری</h1>
      <p className="text-sm text-text2">تنظیمات حساب کاربری در این‌جا قرار می‌گیرد.</p>
      <Button variant="ghost" className="w-fit text-destructive">
        <RemixIcon name="logout-box-r-line" />
        خروج از حساب
      </Button>
    </div>
  )
}
