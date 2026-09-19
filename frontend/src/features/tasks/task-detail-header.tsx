"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DialogTrigger } from "@/components/ui/dialog"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useT } from "@/components/providers/locale-provider"
import { PriorityDot } from "@/features/projects/task-display"
import { FollowersDialog } from "@/features/tasks/followers-dialog"
import { MOCK_CURRENT_USER } from "@/lib/api/mock-data"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import type { TaskFormMemberOption, TaskPriority } from "@/lib/api/types"

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]

const PRIORITY_KEY: Record<TaskPriority, TranslationKey> = {
  none: "priority.none",
  low: "priority.low",
  medium: "priority.medium",
  high: "priority.high",
  urgent: "priority.urgent",
}

const ICON_BUTTON_CLASS = "flex size-7 items-center justify-center rounded-md hover:bg-bg2"

/** رنگ آیکون بسته به فعال بودن — جدا از `ICON_BUTTON_CLASS` چون دو کلاس رنگ Tailwind با
 * اولویت یکسان (`text-icon2` در برابر `text-brand`) روی هم برنده‌ی ثابتی در stylesheet
 * تولیدشده دارند؛ باید همیشه فقط یکی از این دو حاضر باشد، نه هر دو با هم. */
function iconColorClass(active: boolean) {
  return active ? "text-brand" : "text-icon2 hover:text-icon"
}

/**
 * ردیف هدر صفحه‌ی جزئیات تسک: `#displayId` در سمت شروع، و در سمت پایان سه آیکون — اولویت،
 * دنبال‌کنندگان (`FollowersDialog`) و علاقه‌مندی (قلب). فقط در حالت ویرایش (`isEdit`) رندر
 * می‌شود؛ اولویت از ردیف عنوان `TaskForm` به اینجا منتقل شده تا تکراری نباشد.
 */
export function TaskDetailHeader({
  displayId,
  priority,
  onPriorityChange,
  members,
  followers,
  onFollowersChange,
  isFavorite,
  onFavoriteChange,
}: {
  displayId: string
  priority: TaskPriority
  onPriorityChange: (value: TaskPriority) => void
  members: TaskFormMemberOption[]
  followers: string[]
  onFollowersChange: (value: string[]) => void
  isFavorite: boolean
  onFavoriteChange: (value: boolean) => void
}) {
  const t = useT()
  const isFollower = followers.includes(MOCK_CURRENT_USER.name)

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-text3">{displayId}</span>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("taskForm.priorityAria")}
            className={`${ICON_BUTTON_CLASS} ${iconColorClass(false)}`}
          >
            <PriorityDot priority={priority} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={priority}
              onValueChange={(value) => onPriorityChange(value as TaskPriority)}
            >
              {PRIORITIES.map((value) => (
                <DropdownMenuRadioItem key={value} value={value} closeOnClick>
                  <PriorityDot priority={value} label={t(PRIORITY_KEY[value])} />
                  {t(PRIORITY_KEY[value])}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <FollowersDialog
          members={members}
          followers={followers}
          onChange={onFollowersChange}
          trigger={
            <DialogTrigger
              aria-label={t("taskDetail.followers")}
              className={`${ICON_BUTTON_CLASS} ${iconColorClass(isFollower)}`}
            >
              <RemixIcon name={isFollower ? "user-follow-fill" : "user-follow-line"} className="text-base" />
            </DialogTrigger>
          }
        />

        <button
          type="button"
          onClick={() => onFavoriteChange(!isFavorite)}
          aria-label={t("taskDetail.favorite")}
          aria-pressed={isFavorite}
          className={`${ICON_BUTTON_CLASS} ${iconColorClass(isFavorite)}`}
        >
          <RemixIcon name={isFavorite ? "heart-fill" : "heart-line"} className="text-base" />
        </button>
      </div>
    </div>
  )
}
