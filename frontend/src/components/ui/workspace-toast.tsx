"use client"

import { useEffect, useState } from "react"

export function WorkspaceToast() {
  const [message, setMessage] = useState("")

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    const show = (event: Event) => {
      const nextMessage = (event as CustomEvent<{ message?: string }>).detail?.message
      if (!nextMessage) return
      setMessage(nextMessage)
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => setMessage(""), 3200)
    }
    window.addEventListener("quire:toast", show)
    return () => {
      window.removeEventListener("quire:toast", show)
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  if (!message) return null
  return <div role="status" className="fixed inset-x-4 top-4 z-[100] mx-auto w-fit max-w-[calc(100vw-2rem)] rounded-xl bg-[var(--mini-bar-bg)] px-4 py-3 text-sm text-white shadow-lg">{message}</div>
}
