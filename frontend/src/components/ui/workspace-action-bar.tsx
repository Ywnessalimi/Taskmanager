"use client"

import { Button } from "@/components/ui/button"
import { useT } from "@/components/providers/locale-provider"

/** Bottom action bar shared by task and ticket detail workspaces. */
export function WorkspaceActionBar({
  onSave,
  onCancel,
  saveDisabled,
  saving = false,
  saveLabel,
}: {
  onSave: () => void
  onCancel: () => void
  saveDisabled: boolean
  saving?: boolean
  saveLabel?: string
}) {
  const t = useT()

  return (
    <footer className="mx-4 shrink-0 rounded-t-[24px] border border-[var(--mini-bar-border)] bg-[var(--mini-bar-bg)] p-2 text-white backdrop-blur-md lg:mx-0 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:border-[var(--task-workspace-border)] lg:bg-background lg:p-3 lg:text-foreground lg:backdrop-blur-none [padding-bottom:calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex gap-2">
        <Button type="button" onClick={onCancel} variant="outline" className="h-12 min-w-0 flex-1 rounded-full border-[var(--mini-bar-border)] bg-transparent px-3 text-sm text-white hover:bg-white/10 hover:text-white lg:h-9 lg:min-w-0 lg:flex-none lg:rounded-md lg:border-transparent lg:bg-transparent lg:px-3 lg:text-text2 lg:hover:bg-bg2 lg:hover:text-foreground">
          {t("taskForm.cancel")}
        </Button>
        <Button type="button" onClick={onSave} disabled={saveDisabled || saving} className="h-12 min-w-0 flex-1 rounded-full bg-brand px-3 text-sm text-text-on-brand hover:opacity-90 lg:h-9 lg:min-w-24 lg:flex-none lg:rounded-md lg:bg-[var(--mini-bar-bg)] lg:text-white">
          {saving ? t("workspace.saving") : saveLabel ?? t("workspace.register")}
        </Button>
      </div>
    </footer>
  )
}
