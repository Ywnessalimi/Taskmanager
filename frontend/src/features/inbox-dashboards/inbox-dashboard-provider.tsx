"use client"

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react"
import { backendRequest } from "@/lib/api/backend-client"

export type InboxWidgetType = "tickets" | "tasks" | "notifications" | "task-status-chart" | "task-status-donut"
export type InboxDashboardSlot = { id: string; widget: InboxWidgetType | null }
export type CustomInboxDashboard = { id: string; name: string; slots: InboxDashboardSlot[]; remote?: boolean; version?: number }
type StoredDashboards = { selectedId: string; dashboards: CustomInboxDashboard[] }

const MAIN_ID = "main"
const STORAGE_PREFIX = "quire.inbox.dashboards.v1"
const DEFAULT_STORAGE: StoredDashboards = { selectedId: MAIN_ID, dashboards: [] }
const snapshotCache = new Map<string, { raw: string | null; value: StoredDashboards }>()
const memoryFallback = new Map<string, StoredDashboards>()
const CHANGE_EVENT = "quire-inbox-dashboards-changed"

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(userId)}`
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isWidgetType(value: unknown): value is InboxWidgetType {
  return value === "tickets" || value === "tasks" || value === "notifications" || value === "task-status-chart" || value === "task-status-donut"
}

function normalize(value: unknown): StoredDashboards {
  if (!value || typeof value !== "object") return DEFAULT_STORAGE
  const candidate = value as Partial<StoredDashboards>
  const dashboards = Array.isArray(candidate.dashboards)
    ? candidate.dashboards.flatMap((dashboard): CustomInboxDashboard[] => {
      if (!dashboard || typeof dashboard !== "object" || typeof dashboard.id !== "string" || typeof dashboard.name !== "string") return []
      const slots = Array.isArray(dashboard.slots)
        ? dashboard.slots.flatMap((slot): InboxDashboardSlot[] => {
          if (!slot || typeof slot !== "object" || typeof slot.id !== "string") return []
          const widget = slot.widget === null || slot.widget === undefined ? null : isWidgetType(slot.widget) ? slot.widget : null
          return [{ id: slot.id, widget }]
        })
        : []
      return [{ id: dashboard.id, name: dashboard.name.trim() || "کارتابل", slots }]
    })
    : []
  const selectedId = candidate.selectedId === MAIN_ID || dashboards.some((dashboard) => dashboard.id === candidate.selectedId)
    ? candidate.selectedId as string
    : MAIN_ID
  return { selectedId, dashboards }
}

function getSnapshot(userId: string): StoredDashboards {
  const key = storageKey(userId)
  const fallback = memoryFallback.get(key)
  if (fallback) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    const cached = snapshotCache.get(key)
    if (cached?.raw === raw) return cached.value
    const value = raw ? normalize(JSON.parse(raw)) : DEFAULT_STORAGE
    snapshotCache.set(key, { raw, value })
    return value
  } catch {
    return memoryFallback.get(key) ?? DEFAULT_STORAGE
  }
}

function subscribe(userId: string, notify: () => void) {
  const key = storageKey(userId)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return
    snapshotCache.delete(key)
    memoryFallback.delete(key)
    notify()
  }
  const onChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) notify()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function writeStored(userId: string, value: StoredDashboards) {
  const key = storageKey(userId)
  const raw = JSON.stringify(value)
  memoryFallback.set(key, value)
  try {
    window.localStorage.setItem(key, raw)
  } catch {
    // The in-memory dashboard remains usable when browser storage is unavailable.
  }
  snapshotCache.set(key, { raw, value })
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }))
}

function updateStored(userId: string, update: (current: StoredDashboards) => StoredDashboards) {
  writeStored(userId, update(getSnapshot(userId)))
}

type InboxDashboardContextValue = {
  selectedId: string
  dashboards: CustomInboxDashboard[]
  currentDashboard: CustomInboxDashboard & { isMain: boolean }
  error: string
  selectDashboard: (id: string) => void
  createDashboard: (name: string) => void
  deleteDashboard: (id: string) => void
  addSlot: () => void
  setSlotWidget: (slotId: string, widget: InboxWidgetType) => void
  clearSlot: (slotId: string) => void
  saveSlots: (dashboardId: string, slots: InboxDashboardSlot[]) => Promise<void>
}

const InboxDashboardContext = createContext<InboxDashboardContextValue | null>(null)

export function InboxDashboardProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [remote, setRemote] = useState<CustomInboxDashboard[]>([])
  const [remoteSelectedId, setRemoteSelectedId] = useState<string | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    const refresh = () => {
      void backendRequest<CustomInboxDashboard[]>("/dashboards").then(value => { if (active) setRemote(value) }).catch(cause => { if (active) setError(cause.message) })
    }
    refresh()
    window.addEventListener("quire-dashboards-saved", refresh)
    window.addEventListener("focus", refresh)
    return () => { active = false; window.removeEventListener("quire-dashboards-saved", refresh); window.removeEventListener("focus", refresh) }
  }, [userId])
  const stored = useSyncExternalStore(
    (notify) => subscribe(userId, notify),
    () => getSnapshot(userId),
    () => DEFAULT_STORAGE,
  )

  const value = useMemo<InboxDashboardContextValue>(() => {
    const dashboards = [...stored.dashboards, ...remote]
    const selectedId = remote.some(dashboard => dashboard.id === remoteSelectedId) ? remoteSelectedId! : stored.selectedId
    const current = dashboards.find((dashboard) => dashboard.id === selectedId)
    async function saveRemote(dashboard: CustomInboxDashboard, slots: InboxDashboardSlot[]) {
      try {
        const saved = await backendRequest<CustomInboxDashboard>(`/dashboards/${dashboard.id}`, { method: "PATCH", body: JSON.stringify({ version: dashboard.version, slots }) })
        setRemote(previous => previous.map(item => item.id === saved.id ? saved : item))
        setError("")
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not save dashboard")
        throw cause
      }
    }
    return {
      selectedId,
      dashboards,
      error,
      currentDashboard: current
        ? { ...current, isMain: false }
        : { id: MAIN_ID, name: "کارتابل", isMain: true, slots: [] },
      selectDashboard(id) {
        if (remote.some(dashboard => dashboard.id === id)) { setRemoteSelectedId(id); return }
        setRemoteSelectedId(null)
        if (id !== MAIN_ID && !stored.dashboards.some((dashboard) => dashboard.id === id)) return
        updateStored(userId, (currentState) => ({ ...currentState, selectedId: id }))
      },
      createDashboard(name) {
        setRemoteSelectedId(null)
        const cleanName = name.trim()
        if (!cleanName) return
        const id = newId()
        const dashboard = { id, name: cleanName, slots: [] }
        updateStored(userId, (currentState) => ({ dashboards: [...currentState.dashboards, dashboard], selectedId: id }))
      },
      deleteDashboard(id) {
        if (remote.some(dashboard => dashboard.id === id)) {
          void backendRequest(`/dashboards/${id}`, { method: "DELETE" }).then(() => { setRemote(previous => previous.filter(item => item.id !== id)); setRemoteSelectedId(null) }).catch(cause => setError(cause.message))
          return
        }
        if (id === MAIN_ID) return
        updateStored(userId, (currentState) => ({
          dashboards: currentState.dashboards.filter((dashboard) => dashboard.id !== id),
          selectedId: currentState.selectedId === id ? MAIN_ID : currentState.selectedId,
        }))
      },
      addSlot() {
        if (current?.remote) { void saveRemote(current, [...current.slots, { id: newId(), widget: null }]).catch(() => {}); return }
        updateStored(userId, (currentState) => ({
          ...currentState,
          dashboards: currentState.dashboards.map((dashboard) => dashboard.id === currentState.selectedId
            ? { ...dashboard, slots: [...dashboard.slots, { id: newId(), widget: null }] }
            : dashboard),
        }))
      },
      setSlotWidget(slotId, widget) {
        if (current?.remote) { void saveRemote(current, current.slots.map(slot => slot.id === slotId ? { ...slot, widget } : slot)).catch(() => {}); return }
        updateStored(userId, (currentState) => ({
          ...currentState,
          dashboards: currentState.dashboards.map((dashboard) => dashboard.id === currentState.selectedId
            ? { ...dashboard, slots: dashboard.slots.map((slot) => slot.id === slotId ? { ...slot, widget } : slot) }
            : dashboard),
        }))
      },
      clearSlot(slotId) {
        if (current?.remote) { void saveRemote(current, current.slots.map(slot => slot.id === slotId ? { ...slot, widget: null } : slot)).catch(() => {}); return }
        updateStored(userId, (currentState) => ({
          ...currentState,
          dashboards: currentState.dashboards.map((dashboard) => dashboard.id === currentState.selectedId
            ? { ...dashboard, slots: dashboard.slots.map((slot) => slot.id === slotId ? { ...slot, widget: null } : slot) }
            : dashboard),
        }))
      },
      async saveSlots(dashboardId, slots) {
        const dashboard = remote.find(item => item.id === dashboardId)
        if (dashboard) { await saveRemote(dashboard, slots); return }
        updateStored(userId, (currentState) => ({
          ...currentState,
          dashboards: currentState.dashboards.map((dashboard) => dashboard.id === dashboardId ? { ...dashboard, slots } : dashboard),
        }))
      },
    }
  }, [stored, userId, remote, remoteSelectedId, error])

  return <InboxDashboardContext.Provider value={value}>{children}</InboxDashboardContext.Provider>
}

export function useInboxDashboard() {
  const context = useContext(InboxDashboardContext)
  if (!context) throw new Error("useInboxDashboard must be used inside InboxDashboardProvider")
  return context
}
