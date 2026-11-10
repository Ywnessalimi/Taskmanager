"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { cancelAssistantPreview, confirmAssistantPreview, downloadAssistantReport, type AssistantWidget, type ExportOptions, type PreviewWidget, type ReportColumn, type SavedItems, type TaskDraft, type TaskReport } from "@/lib/api/assistant"

const fieldClass = "w-full rounded-md border border-border bg-background p-2 text-sm"

function Preview({ widget, onResult }: { widget: PreviewWidget; onResult: (message: string) => void }) {
  const { locale } = useLocale()
  const fa = locale === "fa"
  const router = useRouter()
  const [selection, setSelection] = useState(widget.items.map(item => item.key))
  const [saving, setSaving] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [result, setResult] = useState<SavedItems>()
  const [error, setError] = useState("")
  const resolved = cancelled || Boolean(result)
  const [expired, setExpired] = useState(() => new Date(widget.expiresAt).getTime() <= Date.now())
  useEffect(() => {
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, new Date(widget.expiresAt).getTime() - Date.now()))
    return () => window.clearTimeout(timer)
  }, [widget.expiresAt])
  const labels: Record<string, string> = fa ? { title: "عنوان", description: "شرح", status: "وضعیت", priority: "اولویت", dueDate: "سررسید", assigneeIds: "مسئولان" } : { title: "Title", description: "Description", status: "Status", priority: "Priority", dueDate: "Due date", assigneeIds: "Assignees" }
  const display = (value: unknown) => Array.isArray(value) ? value.join("، ") : String(value ?? "—")

  async function resolve(confirm: boolean) {
    if (saving || resolved) return
    setSaving(true)
    setError("")
    try {
      if (confirm) {
        const saved = await confirmAssistantPreview(widget.id, selection)
        setResult(saved)
        if (widget.kind === "dashboards_create") window.dispatchEvent(new Event("quire-dashboards-saved"))
        onResult(`${fa ? "ثبت شد" : "Saved"} — ${saved.items.map(item => item.title).join("، ")}`)
        router.refresh()
      } else {
        await cancelAssistantPreview(widget.id)
        setCancelled(true)
        onResult(fa ? "پیشنهاد لغو شد." : "Proposal cancelled.")
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Save failed") }
    finally { setSaving(false) }
  }

  return <section className="space-y-3 rounded-xl border border-border bg-background p-3" aria-label={fa ? "پیش‌نمایش تغییرات" : "Action preview"}>
    <p className="font-semibold">{widget.kind === "tasks_create" ? (fa ? "تسک‌های پیشنهادی" : "Proposed tasks") : (fa ? "پیش‌نمایش تغییرات" : "Review changes")}</p>
    {widget.summary && <p className="whitespace-pre-wrap text-text2">{widget.summary}</p>}
    {!resolved && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selection.length === widget.items.length} disabled={saving || expired} onChange={event => setSelection(event.target.checked ? widget.items.map(item => item.key) : [])} />{fa ? "انتخاب همه" : "Select all"} · {selection.length}/{widget.items.length}</label>}
    <div className="space-y-2">{widget.items.map(item => <article key={item.key} className={`rounded-lg border p-3 ${selection.includes(item.key) ? "border-foreground/30" : "border-border"}`}>
      <label className="flex items-start gap-2 font-medium"><input className="mt-1" type="checkbox" checked={selection.includes(item.key)} disabled={saving || resolved || expired} onChange={event => setSelection(previous => event.target.checked ? [...previous, item.key] : previous.filter(key => key !== item.key))} /><span className="min-w-0 break-words">{item.title}</span></label>
      <p className="mt-1 text-xs text-text2">{item.projectName}</p>
      {item.input && (widget.kind === "tasks_create" || widget.kind === "ticket_create") && <div className="mt-2 space-y-1 text-xs text-text2">
        <p>{fa ? "مسئول" : "Assignee"} · {(item.input.assigneeNames ?? item.assigneeNames ?? []).join("، ") || (fa ? "تعیین نشده" : "Unassigned")}</p>
        <p>{fa ? "اولویت" : "Priority"} · {item.input.priority ?? "none"}{item.input.dueDate ? ` · ${item.input.dueDate}` : ""}</p>
        {item.input.description && <p className="whitespace-pre-wrap">{item.input.description}</p>}
        {item.input.subject && <p>{fa ? "موضوع" : "Subject"} · {item.input.subject}</p>}
        {!!item.input.permissionIds?.length && <p>{fa ? "مجوزهای درخواستی تیکت" : "Requested ticket permissions"} · {item.input.permissionIds.join("، ")}</p>}
        {!!item.input.subtasks?.length && <ul className="list-disc space-y-2 ps-5">{item.input.subtasks.map((child, index) => <li key={index}><p>{child.title}{child.assigneeNames?.length ? ` · ${child.assigneeNames.join("، ")}` : ""}</p><p>{fa ? "اولویت" : "Priority"} · {child.priority ?? "none"}{child.dueDate ? ` · ${child.dueDate}` : ""}</p>{child.description && <p className="whitespace-pre-wrap">{child.description}</p>}</li>)}</ul>}
      </div>}
      {item.reason && <p className="mt-2 text-xs text-text2">{item.reason}</p>}
      {item.patch && <dl className="mt-2 space-y-2 text-xs">{Object.entries(item.patch).map(([key, value]) => <div key={key}>
        <dt className="font-medium">{labels[key] ?? key}</dt>
        <dd className="whitespace-pre-wrap text-text2">{fa ? "قبلی" : "Before"} · {display(key === "assigneeIds" ? item.original?.assigneeNames : item.original?.[key as keyof TaskDraft])}</dd>
        <dd className="whitespace-pre-wrap">{fa ? "جدید" : "After"} · {display(key === "assigneeIds" ? item.assigneeNames : value)}</dd>
      </div>)}</dl>}
    </article>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {result && <div role="status" className="space-y-2"><p className="font-medium">{fa ? "با موفقیت ثبت شد" : "Saved successfully"}</p>{result.items.map(item => <Link key={item.id} href={item.href} className="block underline underline-offset-4">{item.title}</Link>)}</div>}
    {cancelled && <p role="status" className="text-text2">{fa ? "لغو شد" : "Cancelled"}</p>}
    {!resolved && <div className="flex flex-wrap items-center gap-2"><Button disabled={saving || !selection.length || expired} onClick={() => void resolve(true)}>{saving ? (fa ? "در حال ثبت…" : "Saving…") : (fa ? `تأیید ${selection.length} مورد` : `Confirm ${selection.length} items`)}</Button><Button variant="ghost" disabled={saving} onClick={() => void resolve(false)}>{fa ? "انصراف" : "Cancel"}</Button><span className="text-xs text-text3">{expired ? (fa ? "پیش‌نمایش منقضی شده" : "Preview expired") : (fa ? "اعتبار پیش‌نمایش ۳۰ دقیقه" : "Preview valid for 30 minutes")}</span></div>}
  </section>
}

export function FileDownload({ reportId, initial }: { reportId: string; initial?: ExportOptions }) {
  const { locale } = useLocale()
  const fa = locale === "fa"
  const [options, setOptions] = useState<ExportOptions>({ format: "xlsx", locale: fa ? "fa" : "en", ...initial })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const columns: [ReportColumn, string][] = [["displayId", fa ? "شناسه" : "ID"], ["title", fa ? "عنوان" : "Title"], ["project", fa ? "پروژه" : "Project"], ["assignees", fa ? "مسئولان" : "Assignees"], ["status", fa ? "وضعیت" : "Status"], ["priority", fa ? "اولویت" : "Priority"], ["dueDate", fa ? "سررسید" : "Due date"], ["createdAt", fa ? "زمان ساخت" : "Created"], ["timeSpentMinutes", fa ? "دقایق مشترک تسک" : "Shared task minutes"]]
  const selectedColumns = options.columns ?? columns.slice(0, 7).map(([key]) => key)
  async function download() {
    setBusy(true)
    setError("")
    try { await downloadAssistantReport(reportId, { ...options, columns: selectedColumns }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Download failed") }
    finally { setBusy(false) }
  }
  return <div className="space-y-2 border-t border-border pt-3">
    <div className="flex gap-2"><select aria-label={fa ? "فرمت فایل" : "File format"} className={fieldClass} value={options.format} onChange={event => setOptions({ ...options, format: event.target.value as ExportOptions["format"] })}><option value="xlsx">Excel (.xlsx)</option><option value="docx">Word (.docx)</option><option value="pdf">PDF</option><option value="csv">CSV</option></select><Button disabled={busy || !selectedColumns.length} onClick={() => void download()}>{busy ? (fa ? "آماده‌سازی…" : "Preparing…") : (fa ? "دریافت فایل" : "Download")}</Button></div>
    <details><summary className="cursor-pointer text-xs text-text2">{fa ? "تنظیم عنوان و ستون‌های خروجی" : "Customize export"}</summary><div className="mt-2 space-y-2">
      <input aria-label={fa ? "عنوان گزارش" : "Report title"} placeholder={fa ? "عنوان دلخواه گزارش" : "Report title"} className={fieldClass} value={options.title ?? ""} onChange={event => setOptions({ ...options, title: event.target.value || undefined })} />
      <select aria-label={fa ? "گروه‌بندی" : "Grouping"} className={fieldClass} value={options.groupBy ?? "none"} onChange={event => setOptions({ ...options, groupBy: event.target.value as ExportOptions["groupBy"] })}><option value="none">{fa ? "بدون گروه‌بندی" : "No grouping"}</option><option value="project">{fa ? "گروه‌بندی بر اساس پروژه" : "Group by project"}</option><option value="status">{fa ? "گروه‌بندی بر اساس وضعیت" : "Group by status"}</option></select>
      <div className="flex flex-wrap gap-3">{columns.map(([key, label]) => <label key={key} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={selectedColumns.includes(key)} onChange={event => setOptions({ ...options, columns: event.target.checked ? [...selectedColumns, key] : selectedColumns.filter(column => column !== key) })} />{label}</label>)}</div>
      <p className="text-xs text-text3">{fa ? "برای ترتیب ستون‌ها و مرتب‌سازی دلخواه، درخواست را در گفتگو بنویسید." : "Describe your preferred column order and sorting in the conversation."}</p>
    </div></details>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}

function Report({ report }: { report: TaskReport }) {
  const { locale } = useLocale()
  const fa = locale === "fa"
  const [expanded, setExpanded] = useState(false)
  const bars = [[fa ? "در انتظار" : "To do", report.summary.todo], [fa ? "در حال انجام" : "In progress", report.summary.inProgress], [fa ? "انجام‌شده" : "Completed", report.summary.completed]] as const
  return <section className="space-y-3 rounded-xl border border-border bg-background p-3" aria-label={report.title}>
    <div><p className="font-semibold">{report.title}</p><p className="mt-1 text-xs text-text3">{new Date(report.generatedAt).toLocaleString(fa ? "fa-IR" : "en-US")} · {report.summary.total} {fa ? "تسک" : "tasks"}</p></div>
    <div className="space-y-2">{bars.map(([label, count], index) => <div key={label} className="grid grid-cols-[90px_1fr_30px] items-center gap-2 text-xs"><span>{label}</span><div className="h-2 overflow-hidden rounded bg-bg2"><div className="h-full rounded bg-foreground" style={{ width: `${report.summary.total ? count / report.summary.total * 100 : 0}%`, opacity: 0.4 + index * 0.25 }} /></div><span>{count}</span></div>)}</div>
    <div className="max-h-80 overflow-auto"><table className="w-full text-start text-xs"><thead><tr>{[fa ? "تسک" : "Task", fa ? "مسئول" : "Assignee", fa ? "وضعیت" : "Status"].map(title => <th key={title} className="border-b border-border p-2 text-start">{title}</th>)}</tr></thead><tbody>{report.rows.slice(0, expanded ? report.rows.length : 8).map(row => <tr key={row.id}><td className="border-b border-border p-2"><Link href={`/tasks/${row.id}`} className="underline underline-offset-4">{row.title}</Link></td><td className="border-b border-border p-2">{row.assignees || "—"}</td><td className="border-b border-border p-2">{fa ? ({ todo: "در انتظار", "in-progress": "در حال انجام", completed: "انجام‌شده" }[String(row.status)] ?? row.status) : row.status}</td></tr>)}</tbody></table></div>
    {report.rows.length > 8 && <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? (fa ? "نمایش کمتر" : "Show less") : (fa ? `نمایش ${report.rows.length} تسک` : `Show ${report.rows.length} tasks`)}</Button>}
    <ul className="space-y-1 text-xs text-text2">{report.limitations.map(line => <li key={line}>{line}</li>)}</ul>
    <FileDownload reportId={report.id} />
  </section>
}

export function AssistantWidgetView({ widget, onAnswer, onResult }: { widget: AssistantWidget; onAnswer: (answer: string) => void; onResult: (message: string) => void }) {
  const { locale } = useLocale()
  const [answered, setAnswered] = useState(false)
  if (widget.type === "preview") return <Preview widget={widget} onResult={onResult} />
  if (widget.type === "report") return <Report report={widget.report} />
  if (widget.type === "file") {
    const { type: widgetType, reportId, ...options } = widget
    return <section data-widget={widgetType} className="rounded-xl border border-border bg-background p-3"><FileDownload reportId={reportId} initial={options} /></section>
  }
  return <section className="space-y-3 rounded-xl border border-border bg-background p-3"><p className="font-medium">{widget.question}</p><div className="flex flex-col items-stretch gap-2">{widget.options.map(option => <Button key={option} variant="outline" disabled={answered} className="h-auto min-h-9 justify-start whitespace-normal text-start" onClick={() => { setAnswered(true); onAnswer(option) }}>{option}</Button>)}</div><p className="text-xs text-text3">{locale === "fa" ? "می‌توانید پاسخ دلخواه را هم در کادر گفتگو بنویسید." : "You can also type your own answer below."}</p></section>
}
