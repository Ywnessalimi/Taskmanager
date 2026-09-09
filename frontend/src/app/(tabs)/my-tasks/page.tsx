import { Badge } from "@/components/ui/badge"

export default function MyTasksPage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-base font-medium text-foreground">تسک‌های من</h1>
      <p className="text-sm text-text2">
        تسک‌های در حال انجامی که به شما تخصیص داده شده، همراه با نمای Overview شخصی شما.
      </p>
      <Badge variant="secondary" className="w-fit">
        این بخش هنوز ساخته نشده
      </Badge>
    </div>
  )
}
