import type { Task } from "@/lib/api/types"

/** Keeps the existing cross-view event contract; the API response is the only task source. */
export function readTaskDetails(task: Task): Task {
  return task
}

export function saveTaskDetails(task: Task): void {
  window.dispatchEvent(new CustomEvent<Task>("task-details-changed", { detail: task }))
}
