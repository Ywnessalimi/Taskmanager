export function showWorkspaceToast(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("quire:toast", { detail: { message } }))
  }
}

export function displayId(id: string) {
  if (/^[\da-f-]{36}$/i.test(id)) {
    const suffix = id.replace(/-/g, "").slice(-6)
    return String(Number.parseInt(suffix, 16))
  }
  const trailingNumber = id.match(/(\d+)$/)?.[1]
  if (trailingNumber) return trailingNumber
  const suffix = id.replace(/[^a-f\d]/gi, "").slice(-6)
  return String(Number.parseInt(suffix || "0", 16))
}
