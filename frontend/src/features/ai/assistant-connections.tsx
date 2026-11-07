"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { backendRequest } from "@/lib/api/backend-client"
import { issueIntegrationToken, listIntegrationTokens, revokeIntegrationToken, type IntegrationToken } from "@/lib/api/assistant"

export function AssistantConnections() {
  const { locale } = useLocale()
  const fa = locale === "fa"
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [tokens, setTokens] = useState<IntegrationToken[]>([])
  const [name, setName] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [scopes, setScopes] = useState(["read"])
  const [secret, setSecret] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([backendRequest<{ id: string; name: string }[]>("/projects"), listIntegrationTokens()]).then(([projectList, tokenList]) => {
      if (active) { setProjects(projectList); setTokens(tokenList) }
    }).catch(cause => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [])
  async function create() {
    setBusy(true)
    setError("")
    try {
      const result = await issueIntegrationToken(name, selected, scopes)
      setSecret(result.token)
      setTokens(await listIntegrationTokens())
      setName("")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connection failed") }
    finally { setBusy(false) }
  }
  async function revoke(id: string) {
    setBusy(true)
    try { await revokeIntegrationToken(id); setTokens(previous => previous.filter(token => token.id !== id)); setSecret("") }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Revoke failed") }
    finally { setBusy(false) }
  }
  return <div className="space-y-4 p-4 text-sm">
    <p className="font-semibold">{fa ? "اتصال Codex، Claude Code و Cursor" : "Connect Codex, Claude Code and Cursor"}</p>
    <p className="text-xs text-text2">{fa ? "آدرس MCP همین سایت با مسیر زیر است. توکن فقط به پروژه‌ها و عملیات انتخاب‌شده دسترسی دارد و پس از ۳۰ روز منقضی می‌شود." : "Use this site's address followed by the MCP path. Tokens expire after 30 days and only allow the selected projects and operations."}</p>
    <code dir="ltr" className="block rounded border border-border p-2 text-xs">/api/v1/mcp</code>
    <label className="block space-y-1"><span>{fa ? "نام اتصال" : "Connection name"}</span><input className="w-full rounded-md border border-border p-2" placeholder="Cursor" value={name} maxLength={100} onChange={event => setName(event.target.value)} /></label>
    <fieldset className="space-y-2"><legend className="mb-2 font-medium">{fa ? "پروژه‌ها" : "Projects"}</legend>{projects.map(project => <label key={project.id} className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(project.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, project.id] : previous.filter(id => id !== project.id))} />{project.name}</label>)}</fieldset>
    <fieldset className="flex flex-wrap gap-3"><legend className="mb-2 font-medium">{fa ? "مجوزها" : "Permissions"}</legend>{[["read", fa ? "خواندن" : "Read"], ["create", fa ? "ساخت تسک" : "Create tasks"], ["update_status", fa ? "تغییر وضعیت تسک خودم" : "Update my task status"]].map(([scope, label]) => <label key={scope} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={scopes.includes(scope)} onChange={event => setScopes(previous => event.target.checked ? [...previous, scope] : previous.filter(item => item !== scope))} />{label}</label>)}</fieldset>
    <Button disabled={busy || !name.trim() || !selected.length || !scopes.length} onClick={() => void create()}>{fa ? "ساخت توکن" : "Create token"}</Button>
    {secret && <div role="status" className="space-y-2 rounded-lg border border-border p-3"><p>{fa ? "این توکن فقط همین بار نمایش داده می‌شود. آن را در هدر Authorization ابزار خود قرار دهید." : "This token is shown once. Use it in your tool's Authorization header."}</p><textarea aria-label="Bearer token" readOnly dir="ltr" className="w-full rounded border border-border p-2 text-xs" value={`Bearer ${secret}`} /><Button variant="ghost" onClick={() => { void navigator.clipboard.writeText(`Bearer ${secret}`).catch(() => setError(fa ? "متن توکن را دستی کپی کنید." : "Copy the token manually.")) }}>{fa ? "کپی" : "Copy"}</Button></div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="space-y-2 border-t border-border pt-3">{tokens.map(token => <div key={token.id} className="flex items-center justify-between gap-2"><div><p>{token.name}</p><p className="text-xs text-text3">{token.scopes.join(" · ")} · {new Date(token.expiresAt).toLocaleDateString(fa ? "fa-IR" : "en-US")}</p></div><Button variant="ghost" disabled={busy} onClick={() => void revoke(token.id)}>{fa ? "لغو دسترسی" : "Revoke"}</Button></div>)}</div>
  </div>
}
