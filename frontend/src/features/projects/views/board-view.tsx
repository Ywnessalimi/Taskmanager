"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DialogTrigger } from "@/components/ui/dialog"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RemixIcon } from "@/components/ui/remix-icon"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { useT } from "@/components/providers/locale-provider"
import { readTaskDetails } from "@/features/tasks/local-task-details"
import { AssigneePickerDialog } from "@/features/tasks/assignee-picker-dialog"
import { PRIORITY_COLOR, PriorityDot, STATUS_COLUMNS } from "@/features/projects/task-display"
import type { MyTask, Task, TaskPriority } from "@/lib/api/types"

type BoardColumn = { id: string; label: string; color: string; icon: string }

const COLUMN_ICONS = [
  { id: "figma-progress", label: "board.iconProgress" },
  { id: "time-line", label: "board.iconTime" },
  { id: "checkbox-circle-line", label: "board.iconDone" },
  { id: "flag-line", label: "board.iconFlag" },
  { id: "bookmark-line", label: "board.iconBookmark" },
  { id: "pause-circle-line", label: "board.iconPause" },
] as const

function ColumnIcon({ icon }: { icon: string }) {
  return icon === "figma-progress"
    ? <Image src="/images/figma/board/in-progress.svg" alt="" width={24} height={24} className="size-6 shrink-0" />
    : <RemixIcon name={icon} className="inline-flex size-6 shrink-0 items-center justify-center text-2xl leading-none text-white" />
}

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"]

/** رنگ پیش‌فرض ۳ ستون ثابت، هم‌راستا با رنگ‌های همین وضعیت‌ها در نمودار پراکندگی صفحه‌ی پروژه. */
const DEFAULT_COLUMN_COLOR: Record<Task["status"], string> = {
  todo: "var(--text3)",
  "in-progress": "var(--warning)",
  completed: "var(--success)",
}

const DEFAULT_COLUMNS: BoardColumn[] = STATUS_COLUMNS.map((column) => ({
  id: column.id,
  label: column.label,
  color: DEFAULT_COLUMN_COLOR[column.id],
  icon: column.id === "todo" ? "time-line" : column.id === "in-progress" ? "figma-progress" : "checkbox-circle-line",
}))

const STATUS_COLUMN_IDS = new Set<string>(STATUS_COLUMNS.map((column) => column.id))

/**
 * پالت انتخاب رنگ ستون — تزئینی است، نه معنایی، پس مستقیم hex (نه توکن‌های success/warning/error).
 * ۱۲ رنگ در دو ردیف (۸+۴)، مثل انتخابگر رنگ رویداد گوگل‌کلندر — رجوع به `ColorPickerGrid`.
 */
const COLUMN_COLOR_OPTIONS = [
  "#5f6368",
  "#8f8f8f",
  "#6155e0",
  "#3b6fd4",
  "#57a8dc",
  "#379d65",
  "#e0a83e",
  "#e0793e",
  "#dc575a",
  "#d1477a",
  "#b473f4",
  "#8a6650",
]

function buildInitialOrder(tasks: Task[]): Record<string, string[]> {
  const order: Record<string, string[]> = {}
  for (const column of DEFAULT_COLUMNS) order[column.id] = []
  for (const task of tasks) {
    order[task.status] ??= []
    order[task.status].push(task.id)
  }
  return order
}

/** ستون میزبان یک id (خودِ id ستون است، یا ستونی که این تسک الان داخلش است). */
function findContainer(order: Record<string, string[]>, id: string): string | undefined {
  if (id in order) return id
  return Object.keys(order).find((key) => order[key].includes(id))
}

/** پروژه‌ی یک تسک برای نگاشتن به لیست اعضا: `MyTask` (تب «تسک‌های من») خودش `projectId` دارد، بقیه از prop صفحه‌ی پروژه. */
export function resolveProjectId(task: Task, fallback?: string): string | undefined {
  return (task as Partial<MyTask>).projectId ?? fallback
}

export const stop = (event: React.SyntheticEvent) => event.stopPropagation()

export const fieldIconTriggerClass =
  "flex size-6 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"

export const pillTriggerClass = "flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"

export function pillStyle(color: string): React.CSSProperties {
  return { color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }
}

export function FieldIcon({ name, active }: { name: string; active?: boolean }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center">
      <RemixIcon name={name} className={`text-base ${active ? "text-icon" : "text-icon2"}`} />
    </span>
  )
}

/** کلیک روی پیل/آیکون تاریخ مستقیماً همان `DatePickerDialog` مودال را برای ویرایش سررسید باز می‌کند. */
export function DateField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const t = useT()
  return (
    <DatePickerDialog
      value={value ?? ""}
      onChange={onChange}
      trigger={
        value ? (
          <DialogTrigger onPointerDown={stop} onClick={stop} className={pillTriggerClass} style={pillStyle("var(--brand)")}>
            {value}
            <RemixIcon name="calendar-todo-fill" className="text-xs" />
          </DialogTrigger>
        ) : (
          <DialogTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label={t("taskForm.addDate")}>
            <RemixIcon name="calendar-todo-fill" className="text-base" />
          </DialogTrigger>
        )
      }
    />
  )
}

/** کلیک روی پیل/آیکون اولویت یک دراپ‌داون انتخاب اولویت باز می‌کند (همان لیست ۵تایی فرم تسک). */
function PriorityField({ value, onChange }: { value: TaskPriority; onChange: (value: TaskPriority) => void }) {
  const hasPriority = value !== "none"
  const t = useT()

  return (
    <DropdownMenu>
      {hasPriority ? (
        <DropdownMenuTrigger onPointerDown={stop} onClick={stop} className={pillTriggerClass} style={pillStyle(PRIORITY_COLOR[value])}>
          {t(`priority.${value}`)}
          <RemixIcon name="arrow-up-double-line" className="text-xs" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label={t("taskForm.priorityAria")}>
          <RemixIcon name="arrow-up-double-line" className="text-base" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" onClick={stop} className="w-44 min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as TaskPriority)}>
          {PRIORITIES.map((priority) => (
            <DropdownMenuRadioItem key={priority} value={priority} closeOnClick className="whitespace-nowrap">
              <PriorityDot priority={priority} />
              {t(`priority.${priority}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** کلیک روی پیل/آیکون مسئول مودال چندانتخابی مسئولان را باز می‌کند — لیست اعضا از `TaskPanelProvider` (همان گزینه‌های فرم تسک) می‌آید. */
export function AssigneeField({ task, projectId, onChange }: { task: Task; projectId?: string; onChange: (names: string[]) => void }) {
  const t = useT()
  const panel = useTaskPanel()
  const resolvedProjectId = resolveProjectId(task, projectId)
  const members = panel?.projects.find((project) => project.id === resolvedProjectId)?.members ?? []
  const assigneeNames = task.assigneeNames ?? []

  return (
    <AssigneePickerDialog
      members={members}
      assigneeNames={assigneeNames}
      onChange={onChange}
      trigger={
        assigneeNames.length > 1 ? (
          <DialogTrigger onPointerDown={stop} onClick={stop} className="flex w-fit shrink-0 items-center" aria-label={t("taskForm.assign")}>
            <AvatarGroup>
              {assigneeNames.slice(0, 3).map((name) => {
                const member = members.find((m) => m.name === name)
                return (
                  <Avatar key={name} size="sm">
                    {member?.avatarUrl && <AvatarImage src={member.avatarUrl} alt={name} />}
                    <AvatarFallback className="text-[10px]">{name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                )
              })}
              {assigneeNames.length > 3 && (
                <AvatarGroupCount className="size-6 text-[10px]">+{assigneeNames.length - 3}</AvatarGroupCount>
              )}
            </AvatarGroup>
          </DialogTrigger>
        ) : assigneeNames.length === 1 ? (
          <DialogTrigger
            onPointerDown={stop}
            onClick={stop}
            className="flex w-fit shrink-0 items-center gap-1 rounded-full bg-bg2 py-0.5 ps-1 pe-2 text-[11px] font-semibold text-text2 hover:bg-bg3"
          >
            <Avatar size="sm">
              {members.find((m) => m.name === assigneeNames[0])?.avatarUrl && (
                <AvatarImage src={members.find((m) => m.name === assigneeNames[0])!.avatarUrl} alt={assigneeNames[0]} />
              )}
              <AvatarFallback className="text-[10px]">{assigneeNames[0].slice(0, 1)}</AvatarFallback>
            </Avatar>
            {assigneeNames[0]}
          </DialogTrigger>
        ) : (
          <DialogTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label={t("taskForm.assign")}>
            <RemixIcon name="user-add-line" className="text-base" />
          </DialogTrigger>
        )
      }
    />
  )
}

/** محتوای بصری کارت — بین کارت واقعی (قابل‌درگ) و کلون شناور `DragOverlay` مشترک است. */
function TaskCardBody({
  task,
  projectId,
  onUpdate,
}: {
  task: Task
  projectId?: string
  onUpdate: (patch: Partial<Task>) => void
}) {
  return (
    <>
      <p className="py-1 text-sm font-medium text-foreground">{task.title}</p>

      {task.assigneeNames && task.assigneeNames.length > 0 && (
        <AssigneeField
          task={task}
          projectId={projectId}
          onChange={(names) => onUpdate({ assigneeNames: names.length > 0 ? names : undefined })}
        />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {(!task.assigneeNames || task.assigneeNames.length === 0) && (
          <AssigneeField
            task={task}
            projectId={projectId}
            onChange={(names) => onUpdate({ assigneeNames: names.length > 0 ? names : undefined })}
          />
        )}
        <FieldIcon name="file-text-line" active={Boolean(task.description)} />
        <DateField value={task.dueDate} onChange={(value) => onUpdate({ dueDate: value || undefined })} />
        <PriorityField value={task.priority} onChange={(value) => onUpdate({ priority: value })} />
      </div>
    </>
  )
}

/**
 * کارت واقعی — قابل‌درگ (`useSortable`) و قابل‌کلیک: کلیک ساده (بدون حرکت بیش از حد فعال‌سازی
 * سنسور) پنل جزئیات تسک را باز می‌کند؛ کلیک-و-نگه‌داشتن-و-کشیدن درگ را شروع می‌کند. پیل‌های
 * فیلد (مسئول/تاریخ/اولویت) با `stopPropagation` روی pointerdown/click هم از فعال‌سازی درگ و
 * هم از باز شدن پنل جزئیات مستقل می‌مانند.
 */
function SortableTaskCard({
  task,
  projectId,
  onUpdate,
  figmaStyle,
}: {
  task: Task
  projectId?: string
  onUpdate: (patch: Partial<Task>) => void
  figmaStyle?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const panel = useTaskPanel()

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => panel?.openTaskDetail(task)}
      className={`flex touch-none flex-col gap-2 border border-border bg-background px-3 py-2 text-start ${figmaStyle ? "rounded-2xl" : "rounded-4xl"} ${
        isDragging ? "opacity-40" : "cursor-pointer"
      }`}
    >
      <TaskCardBody task={task} projectId={projectId} onUpdate={onUpdate} />
    </div>
  )
}

/** کلون شناور روی نشانگر موس هنگام درگ (`DragOverlay`) — تا کارت هیچ‌وقت زیر ستون‌های دیگر گم نشود. */
function TaskCardOverlay({ task, projectId }: { task: Task; projectId?: string }) {
  return (
    <div className="flex w-64 cursor-grabbing flex-col gap-2 rounded-4xl border border-border bg-background px-3 py-2 shadow-lg">
      <TaskCardBody task={task} projectId={projectId} onUpdate={() => {}} />
    </div>
  )
}

function Column({
  column,
  taskIds,
  tasksById,
  projectId,
  isDragOver,
  onAddTask,
  onUpdateTask,
  onColorChange,
  onIconChange,
  customColors,
  onAddCustomColor,
  figmaStyle,
}: {
  column: BoardColumn
  taskIds: string[]
  tasksById: Map<string, Task>
  projectId?: string
  isDragOver: boolean
  onAddTask: () => void
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void
  onColorChange: (color: string) => void
  onIconChange: (icon: string) => void
  customColors: string[]
  onAddCustomColor: (color: string) => void
  figmaStyle?: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const t = useT()
  const columnLabel = column.id === "todo" ? t("status.todo") : column.id === "in-progress" ? t("status.inProgress") : column.id === "completed" ? t("status.completed") : column.id === "cancelled" ? t("board.cancelled") : column.label

  return (
    <div
      ref={setNodeRef}
      className={`flex shrink-0 flex-col transition-colors duration-150 ${figmaStyle ? "w-[297px] self-start overflow-visible rounded-2xl" : "w-72 overflow-hidden rounded-4xl"} ${
        isDragOver ? "bg-bg3" : figmaStyle ? column.id === "in-progress" ? "bg-[var(--project-column-green)]" : column.id === "cancelled" ? "bg-[var(--project-column-red)]" : "bg-[var(--project-column-blue)]" : "bg-bg2"
      }`}
    >
      <div className={figmaStyle ? "flex items-center gap-2 px-3 pt-3 pb-0.5" : "flex items-center gap-2 px-4 pt-4 pb-1"}>
        {figmaStyle ? (
          <Popover>
            <PopoverTrigger
              aria-label={t("board.changeColor")}
              className="inline-flex min-h-8 min-w-0 items-center gap-1 rounded-[16px] py-1 ps-1 pe-2 text-white"
              style={{ backgroundColor: column.color }}
            >
              <ColumnIcon icon={column.icon} />
              <span className="truncate text-xs font-bold">{columnLabel}</span>
              <span className="flex h-[21px] min-w-5 shrink-0 items-center justify-center rounded-[16px] bg-white px-1.5 py-1 text-xs font-semibold leading-[13px] text-black">{taskIds.length}</span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-3">
              <ColorPickerGrid value={column.color} onChange={onColorChange} customColors={customColors} onAddCustomColor={onAddCustomColor} />
              <IconPicker value={column.icon} onChange={onIconChange} />
            </PopoverContent>
          </Popover>
        ) : <>
        <Popover>
          <PopoverTrigger
            aria-label={t("board.changeColor")}
            className="flex h-4 w-2 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <PopoverContent align="start" className="w-56 p-3">
            <ColorPickerGrid
              value={column.color}
              onChange={onColorChange}
              customColors={customColors}
              onAddCustomColor={onAddCustomColor}
            />
          </PopoverContent>
        </Popover>
        <span className={`min-w-0 truncate text-sm font-medium ${figmaStyle ? "rounded-full px-2 py-1 text-white" : "flex-1 text-foreground"}`} style={figmaStyle ? { backgroundColor: column.color } : undefined}>{columnLabel}</span>
        <span className="flex shrink-0 items-center justify-center rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
          {taskIds.length}
        </span>
        </>}
      </div>

      <SortableContext id={column.id} items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-10 flex-col gap-2 p-2">
          {taskIds.map((taskId) => {
            const task = tasksById.get(taskId)
            return task ? (
              <SortableTaskCard
                key={task.id}
                task={task}
                projectId={projectId}
                onUpdate={(patch) => onUpdateTask(task.id, patch)}
                figmaStyle={figmaStyle}
              />
            ) : null
          })}
          {taskIds.length === 0 && <p className="py-2 text-center text-xs text-text3">{t("board.empty")}</p>}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={onAddTask}
        className={`flex items-center gap-1 px-4 pt-1 pb-4 text-sm hover:opacity-70 ${figmaStyle ? "" : "text-text3"}`}
        style={figmaStyle ? { color: column.color } : undefined}
      >
        {t("nav.newTask")}
        <RemixIcon name="add-line" className="text-base" />
      </button>
    </div>
  )
}

/**
 * جدول انتخاب رنگ — مثل انتخابگر رنگ رویداد گوگل‌کلندر (عنوان «رنگ» + گرید دو‌ردیفه‌ی پالت
 * ثابت + «افزودن رنگ» که یک `<input type="color">` مخفی را باز می‌کند)، بدون قابلیت
 * «تنظیمات پیشرفته» چون اینجا لازم نیست. هم در پاپ‌آور «بورد جدید» و هم در پاپ‌آور تغییر
 * رنگِ ستون‌های موجود استفاده می‌شود — رنگ‌های سفارشیِ افزوده‌شده (`customColors`) بین هر دو
 * مشترک است تا در همان نشست دوباره قابل‌انتخاب بمانند.
 */
function ColorPickerGrid({
  value,
  onChange,
  customColors,
  onAddCustomColor,
}: {
  value: string
  onChange: (color: string) => void
  customColors: string[]
  onAddCustomColor: (color: string) => void
}) {
  const t = useT()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const allColors = [...COLUMN_COLOR_OPTIONS, ...customColors]

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-text2">{t("board.color")}</span>
      <div className="grid grid-cols-8 gap-2">
        {allColors.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-label={`${t("board.color")} ${option}`}
            className={`size-6 shrink-0 rounded-full ${
              value === option ? "ring-2 ring-offset-2 ring-offset-popover ring-foreground" : ""
            }`}
            style={{ backgroundColor: option }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => colorInputRef.current?.click()}
        className="flex w-fit items-center gap-1.5 rounded-md py-1 text-sm text-text2 hover:text-foreground"
      >
        <RemixIcon name="add-line" className="text-base" />
        {t("board.addColor")}
      </button>
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        onChange={(event) => {
          onAddCustomColor(event.target.value)
          onChange(event.target.value)
        }}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  )
}

/** همان نشان ۲۴px هدر ستون؛ هنگام ساخت ستون و از تنظیمات هدر انتخاب می‌شود. */
function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const t = useT()
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <span className="text-xs text-text2">{t("board.icon")}</span>
      <div className="flex flex-wrap gap-2">
        {COLUMN_ICONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={t(option.label)}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={`flex size-9 items-center justify-center rounded-full bg-[var(--mini-bar-bg)] ${value === option.id ? "ring-2 ring-[var(--project-brand)] ring-offset-2" : ""}`}
          >
            <ColumnIcon icon={option.id} />
          </button>
        ))}
      </div>
    </div>
  )
}

/** پاپ‌آور «بورد جدید»: نام، رنگ و در نمای پروژه آیکون — انتهای ردیف ستون‌ها. */
function AddColumnTile({
  onCreate,
  customColors,
  onAddCustomColor,
  figmaStyle,
}: {
  onCreate: (label: string, color: string, icon: string) => void
  customColors: string[]
  onAddCustomColor: (color: string) => void
  figmaStyle?: boolean
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLUMN_COLOR_OPTIONS[0])
  const [icon, setIcon] = useState<string>("figma-progress")

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const label = name.trim()
    if (!label) return
    onCreate(label, color, icon)
    setName("")
    setColor(COLUMN_COLOR_OPTIONS[0])
    setIcon("figma-progress")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`flex h-fit shrink-0 items-center justify-center gap-2 bg-bg2 p-4 text-sm text-text2 hover:text-foreground ${figmaStyle ? "w-[297px] rounded-2xl" : "w-72 rounded-4xl"}`}>
        {t("board.newBoard")}
        <RemixIcon name="add-line" className="text-lg" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("board.boardName")}
            autoFocus
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
          />
          <ColorPickerGrid
            value={color}
            onChange={setColor}
            customColors={customColors}
            onAddCustomColor={onAddCustomColor}
          />
          {figmaStyle && <IconPicker value={icon} onChange={setIcon} />}
          <Button type="submit" size="sm" disabled={!name.trim()}>
            {t("board.createBoard")}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

/**
 * کانبان با Drag & Drop واقعی (`@dnd-kit/core` + `@dnd-kit/sortable`)، طبق طرح Figma «AlignUI»
 * (node 13728:4555). چند نکته‌ی معماری:
 *
 * - عضویت/ترتیب تسک‌ها در `order` (نگاشت ستون→آرایه‌ی id) نگه داشته می‌شود، نه با فیلتر کردن
 *   `tasks` بر اساس `status` — چون حالا ستون‌های سفارشی هم داریم که معادل واقعی در
 *   `Task.status` ندارند، و چون سفارشی‌سازی *ترتیب* داخل هر ستون فقط با یک آرایه‌ی مستقل
 *   ممکن است (`@dnd-kit/sortable` دقیقاً همین الگوی «چند-کانتینر» را پیشنهاد می‌کند).
 * - برای ۳ ستون پیش‌فرض، رها کردن روی آن‌ها `task.status` واقعی را هم عوض می‌کند (سازگار با
 *   بقیه‌ی نماها)؛ برای ستون سفارشی فقط `order` عوض می‌شود.
 * - `DragOverlay` یک کلون شناور کامل‌کدر روی نشانگر موس رندر می‌کند تا کارت زیر ستون‌های دیگر
 *   گم نشود؛ کارت اصلی سرِ جایش با opacity کم باقی می‌ماند. برخورد به ستونی دیگر هم رنگ همان
 *   ستون (`isDragOver`) و هم جابه‌جایی/انیمیشن خودکار کارت‌های داخلش (`useSortable`) را
 *   هم‌زمان با هاور فعال می‌کند، نه فقط روی رها کردن نهایی.
 * - کلیک ساده روی کارت (بدون عبور از آستانه‌ی حرکت سنسور) پنل جزئیات را باز می‌کند؛ پیل‌های
 *   مسئول/تاریخ/اولویت با `stopPropagation` مستقل کلیک می‌شوند و مودال/دراپ‌داون ویرایش
 *   همان فیلد را باز می‌کنند (بدون باز کردن پنل جزئیات).
 */
export function BoardView({ tasks: initialTasks, projectId, figmaStyle = false }: { tasks: Task[]; projectId?: string; figmaStyle?: boolean }) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [columns, setColumns] = useState<BoardColumn[]>(() => figmaStyle ? [
    { id: "todo", label: "در انتظار", color: "var(--project-status-blue)", icon: "time-line" },
    { id: "in-progress", label: "در حال انجام", color: "var(--project-status-green)", icon: "figma-progress" },
    { id: "completed", label: "انجام‌شده", color: "var(--project-status-blue)", icon: "checkbox-circle-line" },
    { id: "cancelled", label: "لغو شده", color: "var(--project-status-red)", icon: "pause-circle-line" },
  ] : DEFAULT_COLUMNS)
  const [customColors, setCustomColors] = useState<string[]>([])
  const [order, setOrder] = useState<Record<string, string[]>>(() => ({ ...buildInitialOrder(initialTasks), ...(figmaStyle ? { cancelled: [] } : {}) }))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const nextColumnId = useRef(1)
  const panel = useTaskPanel()

  useEffect(()=>{
    const refresh=()=>{setTasks(previous=>previous.map(task=>{try{return readTaskDetails(task)}catch{return task}}))}
    const changed=(event:Event)=>{const task=(event as CustomEvent<Task>).detail;refresh();setOrder(previous=>{const column=Object.keys(previous).find(key=>previous[key].includes(task.id));if(!column||column===task.status||!["todo","in-progress","completed"].includes(column))return previous;return {...previous,[column]:previous[column].filter(id=>id!==task.id),[task.status]:[...(previous[task.status]??[]).filter(id=>id!==task.id),task.id]}})}
    refresh()
    window.addEventListener("task-details-changed",changed)
    return()=>window.removeEventListener("task-details-changed",changed)
  },[])
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const activeTask = activeId ? tasksById.get(activeId) : undefined

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function updateTask(taskId: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
  }

  function updateColumnColor(columnId: string, color: string) {
    setColumns((prev) => prev.map((column) => (column.id === columnId ? { ...column, color } : column)))
  }

  function updateColumnIcon(columnId: string, icon: string) {
    setColumns((prev) => prev.map((column) => (column.id === columnId ? { ...column, icon } : column)))
  }

  function addCustomColor(color: string) {
    setCustomColors((prev) => (prev.includes(color) ? prev : [...prev, color]))
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) {
      setDragOverColumnId(null)
      return
    }

    const activeTaskId = String(active.id)
    const overId = String(over.id)
    const activeContainer = findContainer(order, activeTaskId)
    const overContainer = findContainer(order, overId)
    setDragOverColumnId(overContainer ?? null)
    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setOrder((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer]
      const overIndex = overItems.indexOf(overId)
      const insertAt = overIndex === -1 ? overItems.length : overIndex
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeTaskId),
        [overContainer]: [...overItems.slice(0, insertAt), activeTaskId, ...overItems.slice(insertAt)],
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setDragOverColumnId(null)
    if (!over) return

    const activeTaskId = String(active.id)
    const overId = String(over.id)
    const container = findContainer(order, overId)
    if (!container) return

    setOrder((prev) => {
      const items = prev[container]
      const activeIndex = items.indexOf(activeTaskId)
      const overIndex = items.indexOf(overId)
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return prev
      return { ...prev, [container]: arrayMove(items, activeIndex, overIndex) }
    })

    if (STATUS_COLUMN_IDS.has(container)) {
      updateTask(activeTaskId, { status: container as Task["status"] })
    }
  }

  function createColumn(label: string, color: string, icon: string) {
    const id = `custom-${nextColumnId.current++}`
    setColumns((prev) => [...prev, { id, label, color, icon }])
    setOrder((prev) => ({ ...prev, [id]: [] }))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setDragOverColumnId(null)
      }}
    >
      <div data-slot="board-scroll" className={figmaStyle ? "-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "overflow-x-auto pb-2"}>
      <div className={figmaStyle ? "flex w-max min-w-full gap-6 overflow-visible py-2" : "flex w-max min-w-full gap-4"}>
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            taskIds={order[column.id] ?? []}
            tasksById={tasksById}
            projectId={projectId}
            isDragOver={dragOverColumnId === column.id}
            onAddTask={() => { if (window.matchMedia("(max-width: 1023px)").matches) router.push(`/tasks/new${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`); else panel?.openNewTask() }}
            onUpdateTask={updateTask}
            onColorChange={(color) => updateColumnColor(column.id, color)}
            onIconChange={(icon) => updateColumnIcon(column.id, icon)}
            customColors={customColors}
            onAddCustomColor={addCustomColor}
            figmaStyle={figmaStyle}
          />
        ))}
        <AddColumnTile onCreate={createColumn} customColors={customColors} onAddCustomColor={addCustomColor} figmaStyle={figmaStyle} />
      </div>
      </div>

      <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} projectId={projectId} /> : null}</DragOverlay>
    </DndContext>
  )
}
