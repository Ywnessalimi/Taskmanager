"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useT } from "@/components/providers/locale-provider"
import { NewTaskAsset } from "./new-task-assets"
import { MobileTaskAsset } from "./mobile-task-assets"

/** منوی ساخت موبایل 1722:27994؛ Esc، کلیک بیرون و بستن همگی Dialog را می‌بندند. */
export function MobileCreateMenu({ projectId }: { projectId?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const t = useT()
  function navigate(href: string) { setOpen(false); router.push(href) }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger className="fixed bottom-22 start-2.5 z-40 flex h-9 items-center gap-2 rounded-full bg-[var(--project-brand)] py-2 ps-2 pe-4 text-[13px] font-semibold text-white lg:hidden"><MobileTaskAsset name="create" className="brightness-0 invert" />{t("projects.create")}</DialogTrigger>
    <DialogContent variant="createMenu" showCloseButton={false} overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-none" className="[--task-workspace-icon-filter:none] lg:hidden">
      <DialogTitle className="sr-only">{t("projects.create")}</DialogTitle>
      <button type="button" onClick={() => navigate(`/tasks/new${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`)} className="flex h-9 w-full items-center gap-2 rounded-full bg-white p-2 text-[13px] font-medium text-black"><NewTaskAsset name="task-line" />{t("nav.newTask")}</button>
      <button type="button" onClick={() => navigate(`/tickets/new${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`)} className="flex h-9 w-full items-center gap-2 rounded-full bg-white p-2 text-[13px] font-medium text-black"><NewTaskAsset name="chat-smile-line" />{t("newTask.newRequest")}</button>
      <button type="button" disabled title={t("newTask.notAvailable")} className="flex h-9 w-full items-center gap-2 rounded-full bg-white p-2 text-[13px] font-medium text-black"><NewTaskAsset name="folder-add-line" />{t("newTask.newProject")}</button>
      <DialogClose className="flex h-9 items-center gap-2 rounded-full bg-[var(--project-brand)] py-2 ps-2 pe-4 text-[13px] font-semibold text-white"><MobileTaskAsset name="close" />{t("mobileTask.close")}</DialogClose>
    </DialogContent>
  </Dialog>
}
