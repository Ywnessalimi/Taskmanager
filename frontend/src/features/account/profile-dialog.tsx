"use client"

import { useRef, useState } from "react"
import { useLocale } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CurrentUser } from "@/lib/api/types"

const FIELD_CLASS =
  "w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"

/**
 * فرم ویرایش پروفایل؛ عکس در مرورگر کوچک می‌شود و همراه اطلاعات با API حساب ذخیره می‌شود.
 */
export function ProfileDialog({
  user,
  onSave,
}: {
  user: CurrentUser
  onSave: (patch: Pick<CurrentUser, "name" | "email" | "bio" | "avatarUrl">) => Promise<void>
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [bio, setBio] = useState(user.bio ?? "")
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLocale()

  function reset() {
    setName(user.name)
    setEmail(user.email)
    setBio(user.bio ?? "")
    setAvatarUrl(user.avatarUrl ?? "")
    setError(null)
  }

  async function choosePhoto(file?: File) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError(t("account.photoInvalid"))
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Canvas unavailable")
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image conversion failed")), "image/jpeg", 0.82))
      if (blob.size > 600_000) throw new Error("Image is too large")
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image conversion failed"))
        reader.onerror = () => reject(new Error("Image conversion failed"))
        reader.readAsDataURL(blob)
      })
      setAvatarUrl(dataUrl)
      setError(null)
    } catch {
      setError(t("account.photoInvalid"))
    }
  }

  async function save() {
    if (!name.trim() || !email.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), email: email.trim(), bio: bio.trim(), avatarUrl: avatarUrl || undefined })
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("account.profileSaveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset() }}>
      <DialogTrigger onClick={() => { reset(); setOpen(true) }} render={<Button variant="ghost" className="text-text2" />}>
        <RemixIcon name="pencil-line" className="text-base" />
        {t("account.edit")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("account.editProfileTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-md border border-border p-3">
            <Avatar size="lg">{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}<AvatarFallback>{name.slice(0, 1)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("account.profilePhoto")}</p>
              <p className="text-xs text-text3">{t("account.photoHint")}</p>
            </div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { void choosePhoto(event.target.files?.[0]); event.currentTarget.value = "" }} />
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>{t("account.choosePhoto")}</Button>
          </div>
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

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-start gap-2">
          <Button type="button" disabled={!name.trim() || !email.trim() || saving} onClick={() => void save()}>{saving ? t("account.saving") : t("account.save")}</Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>{t("account.cancel")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
