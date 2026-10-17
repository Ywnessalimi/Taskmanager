"use client"
import { usePathname } from "next/navigation"
import { useTaskPanel } from "@/components/providers/task-panel-provider"
import { Dialog } from "@/components/ui/dialog"
import { NewTaskDialog } from "./new-task-dialog"
import { readTaskDetails } from "./local-task-details"

/** میزبان مودال مشترک ساخت/جزئیات؛ فضای لیست را جمع نمی‌کند. */
export function TaskPanel(){
 const context=useTaskPanel(),pathname=usePathname(),state=context?.panel
 if(!context||!state)return null
 let task=state.kind==="detail"?state.task:undefined
 if(task){try{task=readTaskDetails(task)}catch{/* داده اصلی هنگام storage نامعتبر */}}
 const routeProjectId=pathname.match(/\/projects\/([^/]+)/)?.[1]
 const projectId=(state.kind==="detail" ? (state.task as typeof state.task & {projectId?:string}).projectId : undefined) ?? context.projects.find(project=>project.id===routeProjectId)?.id
 return <Dialog open onOpenChange={open=>{if(!open)context.close()}}><NewTaskDialog key={task?.id??"new"} task={task} projects={context.projects} defaultProjectId={projectId} user={context.user} onDone={context.close} /></Dialog>
}
