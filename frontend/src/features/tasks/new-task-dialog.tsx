"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { TaskCreateForm } from "./task-create-form"
import type { TaskFormProjectOption } from "@/lib/api/types"

/**
 * تریگر «تسک جدید» در `DesktopHeader` — روی موبایل همچنان `/tasks/new` یک صفحه‌ی کامل است
 * (`AddTaskFab`)، اما دسکتاپ به‌جای ناوبری به صفحه‌ی جدید، همین فرم را در یک پنل کناری
 * (نه مودال وسط‌چین — `variant="side"`، تقریباً ۳۰٪ عرض صفحه، چسبیده به سمت راست) باز می‌کند.
 * `open` کنترل‌شده است تا بعد از ثبت/انصراف (`TaskCreateForm`'s `onDone`) بتوانیم پنل را ببندیم.
 */
export function NewTaskDialog({ projects }: { projects: TaskFormProjectOption[] }) {
  const [open, setOpen] = useState(false)
  const t = useT()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-text-on-brand hover:opacity-90">
        <RemixIcon name="add-circle-line" className="text-base" />
        {t("nav.newTask")}
      </DialogTrigger>
      <DialogContent variant="side">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle>{t("nav.newTask")}</DialogTitle>
        </DialogHeader>
        <TaskCreateForm projects={projects} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
