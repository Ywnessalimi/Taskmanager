"use client"

import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { AI_GRADIENT, AIAssistantDialog } from "@/features/ai/ai-assistant-dialog"

/**
 * دکمه‌ی شناور «دستیار هوش مصنوعی» — فعلاً فقط از `lg` به بالا دیده می‌شود و در موبایل
 * پنهان است (رجوع به `(tabs)/layout.tsx`). عمداً در سمت مقابل `AddTaskFab`
 * (`end`، یعنی چپ در RTL) می‌نشیند تا با هم تداخل نکنند.
 *
 * گرادینت و سایه‌اش دقیقاً طبق مشخصات طرح است؛ چرخش آرام گرادینت با کلاس `animate-ai-gradient`
 * در `globals.css` انجام می‌شود (فقط `background-position`، نه رنگ‌ها، و خیلی کند/نرم).
 */
export function AIAssistantFab() {
  const t = useT()

  return (
    <Dialog>
      <DialogTrigger
        aria-label={t("aiAssistant.aria")}
        className="animate-ai-gradient fixed bottom-6 end-4 z-40 hidden size-13 items-center justify-center rounded-full text-white lg:flex"
        style={{
          backgroundImage: AI_GRADIENT,
          filter: "drop-shadow(0 12.432px 24.863px rgba(0, 0, 0, 0.08))",
        }}
      >
        <RemixIcon name="sparkling-2-fill" className="text-2xl" />
      </DialogTrigger>
      <AIAssistantDialog />
    </Dialog>
  )
}
