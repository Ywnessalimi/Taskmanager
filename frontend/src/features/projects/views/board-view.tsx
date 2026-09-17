"use client"

import { useMemo, useRef, useState } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { PRIORITY_COLOR, PRIORITY_LABEL, PriorityDot, STATUS_COLUMNS } from "@/features/projects/task-display"
import type { MyTask, Task, TaskPriority } from "@/lib/api/types"

type BoardColumn = { id: string; label: string; color: string }

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
}))

const STATUS_COLUMN_IDS = new Set<string>(STATUS_COLUMNS.map((column) => column.id))

/** پالت انتخاب رنگ بورد سفارشی — تزئینی است، نه معنایی، پس مستقیم hex (نه توکن‌های success/warning/error). */
const COLUMN_COLOR_OPTIONS = ["#b473f4", "#57a8dc", "#379d65", "#e0a83e", "#dc575a", "#ec4899"]

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
function resolveProjectId(task: Task, fallback?: string): string | undefined {
  return (task as Partial<MyTask>).projectId ?? fallback
}

const stop = (event: React.SyntheticEvent) => event.stopPropagation()

const fieldIconTriggerClass =
  "flex size-6 shrink-0 items-center justify-center rounded-md text-icon2 hover:bg-bg2 hover:text-icon"

const pillTriggerClass = "flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"

function pillStyle(color: string): React.CSSProperties {
  return { color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }
}

function FieldIcon({ name, active }: { name: string; active?: boolean }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center">
      <RemixIcon name={name} className={`text-base ${active ? "text-icon" : "text-icon2"}`} />
    </span>
  )
}

/** کلیک روی پیل/آیکون تاریخ مستقیماً همان `DatePickerDialog` مودال را برای ویرایش سررسید باز می‌کند. */
function DateField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
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
          <DialogTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label="افزودن تاریخ">
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

  return (
    <DropdownMenu>
      {hasPriority ? (
        <DropdownMenuTrigger onPointerDown={stop} onClick={stop} className={pillTriggerClass} style={pillStyle(PRIORITY_COLOR[value])}>
          {PRIORITY_LABEL[value]}
          <RemixIcon name="arrow-up-double-line" className="text-xs" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label="تعیین اولویت">
          <RemixIcon name="arrow-up-double-line" className="text-base" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" onClick={stop}>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as TaskPriority)}>
          {PRIORITIES.map((priority) => (
            <DropdownMenuRadioItem key={priority} value={priority} closeOnClick>
              <PriorityDot priority={priority} />
              {PRIORITY_LABEL[priority]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** کلیک روی پیل/آیکون مسئول یک دراپ‌داون انتخاب عضو باز می‌کند — لیست اعضا از `TaskPanelProvider` (همان گزینه‌های فرم تسک) می‌آید. */
function AssigneeField({ task, projectId, onChange }: { task: Task; projectId?: string; onChange: (name: string) => void }) {
  const panel = useTaskPanel()
  const resolvedProjectId = resolveProjectId(task, projectId)
  const members = panel?.projects.find((project) => project.id === resolvedProjectId)?.members ?? []

  return (
    <DropdownMenu>
      {task.assigneeName ? (
        <DropdownMenuTrigger
          onPointerDown={stop}
          onClick={stop}
          className="flex w-fit shrink-0 items-center gap-1 rounded-full bg-bg2 py-0.5 ps-1 pe-2 text-[11px] font-semibold text-text2 hover:bg-bg3"
        >
          {task.assigneeName}
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">{task.assigneeName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger onPointerDown={stop} onClick={stop} className={fieldIconTriggerClass} aria-label="تعیین مسئول">
          <RemixIcon name="user-add-line" className="text-base" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" onClick={stop}>
        <DropdownMenuRadioGroup value={task.assigneeName ?? ""} onValueChange={(next) => onChange(next as string)}>
          <DropdownMenuRadioItem value="" closeOnClick>
            بدون مسئول
          </DropdownMenuRadioItem>
          {members.map((member) => (
            <DropdownMenuRadioItem key={member.name} value={member.name} closeOnClick>
              <Avatar size="sm">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              {member.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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

      {task.assigneeName && (
        <AssigneeField
          task={task}
          projectId={projectId}
          onChange={(name) => onUpdate({ assigneeName: name || undefined })}
        />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {!task.assigneeName && (
          <AssigneeField
            task={task}
            projectId={projectId}
            onChange={(name) => onUpdate({ assigneeName: name || undefined })}
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
}: {
  task: Task
  projectId?: string
  onUpdate: (patch: Partial<Task>) => void
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
      className={`flex touch-none flex-col gap-2 rounded-4xl border border-border bg-background px-3 py-2 text-start ${
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
}: {
  column: BoardColumn
  taskIds: string[]
  tasksById: Map<string, Task>
  projectId?: string
  isDragOver: boolean
  onAddTask: () => void
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void
}) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col overflow-hidden rounded-4xl transition-colors duration-150 ${
        isDragOver ? "bg-bg3" : "bg-bg2"
      }`}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-1">
        <span className="flex shrink-0 items-center justify-center rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
          {taskIds.length}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{column.label}</span>
        <span className="h-4 w-2 shrink-0 rounded-full" style={{ backgroundColor: column.color }} />
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
              />
            ) : null
          })}
          {taskIds.length === 0 && <p className="py-2 text-center text-xs text-text3">خالی</p>}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={onAddTask}
        className="flex items-center gap-1 px-4 pt-1 pb-4 text-sm text-text3 hover:text-foreground"
      >
        تسک جدید
        <RemixIcon name="add-line" className="text-base" />
      </button>
    </div>
  )
}

/** پاپ‌آور «بورد جدید»: اسم + یک رنگ از پالت ثابت — همیشه انتهای ردیف ستون‌ها (سمت چپ در RTL). */
function AddColumnTile({ onCreate }: { onCreate: (label: string, color: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLUMN_COLOR_OPTIONS[0])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const label = name.trim()
    if (!label) return
    onCreate(label, color)
    setName("")
    setColor(COLUMN_COLOR_OPTIONS[0])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-4xl bg-bg2 p-4 text-sm text-text2 hover:text-foreground">
        بورد جدید
        <RemixIcon name="add-line" className="text-lg" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اسم بورد"
            autoFocus
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-text3"
          />
          <div className="flex flex-wrap gap-2">
            {COLUMN_COLOR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`رنگ ${option}`}
                className={`size-6 shrink-0 rounded-full ${
                  color === option ? "ring-2 ring-offset-2 ring-foreground" : ""
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
          <Button type="submit" size="sm" disabled={!name.trim()}>
            ساخت بورد
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
export function BoardView({ tasks: initialTasks, projectId }: { tasks: Task[]; projectId?: string }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [columns, setColumns] = useState<BoardColumn[]>(DEFAULT_COLUMNS)
  const [order, setOrder] = useState<Record<string, string[]>>(() => buildInitialOrder(initialTasks))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const nextColumnId = useRef(1)
  const panel = useTaskPanel()

  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const activeTask = activeId ? tasksById.get(activeId) : undefined

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function updateTask(taskId: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
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

  function createColumn(label: string, color: string) {
    const id = `custom-${nextColumnId.current++}`
    setColumns((prev) => [...prev, { id, label, color }])
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
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            taskIds={order[column.id] ?? []}
            tasksById={tasksById}
            projectId={projectId}
            isDragOver={dragOverColumnId === column.id}
            onAddTask={() => panel?.openNewTask()}
            onUpdateTask={updateTask}
          />
        ))}
        <AddColumnTile onCreate={createColumn} />
      </div>

      <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} projectId={projectId} /> : null}</DragOverlay>
    </DndContext>
  )
}
