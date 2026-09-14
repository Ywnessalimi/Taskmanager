"use client"

import { useState } from "react"
import { useLocale } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import type { CurrentUser } from "@/lib/api/types"

const FIELD_CLASS =
  "w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"

/**
 * فرم ویرایش پروفایل. مقدارهای اولیه از کاربر فعلی می‌آید و ذخیره فقط `onSave` را صدا می‌زند
 * (نگه‌داری state با کامپوننت والد است) — هنوز هیچ API واقعی‌ای پشت آن نیست.
 */
export function ProfileDialog({
  user,
  onSave,
}: {
  user: CurrentUser
  onSave: (patch: Pick<CurrentUser, "name" | "email" | "bio">) => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [bio, setBio] = useState(user.bio ?? "")
  const { t } = useLocale()

  function reset() {
    setName(user.name)
    setEmail(user.email)
    setBio(user.bio ?? "")
  }

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger render={<Button variant="ghost" className="text-text2" />}>
        <RemixIcon name="pencil-line" className="text-base" />
        {t("account.edit")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("account.editProfileTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text2">{t("account.name")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text2">{t("account.email")}</span>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${FIELD_CLASS} text-start`}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text2">{t("account.bio")}</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("account.bioPlaceholder")}
              className={`${FIELD_CLASS} resize-none`}
            />
          </label>
        </div>

        <div className="flex justify-start gap-2">
          <DialogClose
            render={
              <Button
                disabled={!name.trim() || !email.trim()}
                onClick={() => onSave({ name: name.trim(), email: email.trim(), bio: bio.trim() })}
              />
            }
          >
            {t("account.save")}
          </DialogClose>
          <DialogClose render={<Button variant="ghost" />}>{t("account.cancel")}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
