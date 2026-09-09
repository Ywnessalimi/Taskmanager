import { Badge } from "@/components/ui/badge"

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-base font-medium text-foreground">اعلان‌ها</h1>
      <p className="text-sm text-text2">
        فیلتر بین All / Unread / Read / Approval و لیست اعلان‌های شما در این‌جا خواهد بود.
      </p>
      <Badge variant="secondary" className="w-fit">
        این بخش هنوز ساخته نشده
      </Badge>
    </div>
  )
}
