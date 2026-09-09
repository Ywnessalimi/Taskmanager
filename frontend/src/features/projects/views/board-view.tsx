"use client"

import { useState } from "react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { PriorityDot, STATUS_COLUMNS } from "@/features/projects/task-display"
import type { Task } from "@/lib/api/types"

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex touch-none flex-col gap-1.5 rounded-md border border-border bg-background p-2.5 text-sm ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <div className="flex items-center gap-1.5">
        <PriorityDot priority={task.priority} />
        <span className="text-xs text-text3">{task.displayId}</span>
      </div>
      <p className="text-foreground">{task.title}</p>
      {task.assigneeName && <p className="text-xs text-text2">{task.assigneeName}</p>}
    </div>
  )
}

function Column({ id, label, tasks }: { id: Task["status"]; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-md border border-border p-3 ${isOver ? "bg-bg2" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-text3">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && <p className="py-2 text-center text-xs text-text3">خالی</p>}
      </div>
    </div>
  )
}

/** ستون‌ها فعلاً همان ۳ وضعیت ثابت تسک هستند؛ مدیریت ستون سفارشی هنوز پیاده نشده (رجوع به README همین فیچر). */
export function BoardView({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as Task["status"]
    setTasks((prev) => prev.map((task) => (task.id === active.id ? { ...task, status: newStatus } : task)))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUS_COLUMNS.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            label={column.label}
            tasks={tasks.filter((task) => task.status === column.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}
