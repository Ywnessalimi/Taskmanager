"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "cn"

/**
 * برخلاف `Dialog` (مودال، پس‌زمینه‌ی تیره، وسط یا کنار صفحه)، `Popover` **غیرمودال** است:
 * بدون پس‌زمینه/overlay، دقیقاً کنار همان المانی که کلیک شده باز می‌شود (با `Positioner`)، و
 * با کلیک روی هر نقطه‌ی دیگر خودش بسته می‌شود (رفتار پیش‌فرض `modal={false}` در Base UI) —
 * برای وقتی محتوا بیشتر شبیه یک منوی سریع/پیش‌نمایش است تا یک دیالوگ کامل، مثل
 * `NotificationsPreviewDialog`.
 */
function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverContent({
  className,
  align = "end",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 8,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <PopoverPortal>
      <PopoverPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 origin-(--transform-origin) rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("text-base font-medium leading-none", className)}
      {...props}
    />
  )
}

export { Popover, PopoverTrigger, PopoverPortal, PopoverContent, PopoverClose, PopoverTitle }
