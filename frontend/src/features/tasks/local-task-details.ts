import type { Task } from "@/lib/api/types"
const KEY="quire:task-details:v1"
export function readTaskDetails(task:Task):Task {const entries:Record<string,Partial<Task>>=JSON.parse(localStorage.getItem(KEY)??"{}");return {...task,...entries[task.id]}}
export function saveTaskDetails(task:Task):void {const entries:Record<string,Partial<Task>>=JSON.parse(localStorage.getItem(KEY)??"{}");localStorage.setItem(KEY,JSON.stringify({...entries,[task.id]:task}));window.dispatchEvent(new CustomEvent<Task>("task-details-changed",{detail:task}))}
