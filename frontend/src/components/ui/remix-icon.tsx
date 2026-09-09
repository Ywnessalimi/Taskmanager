import { cn } from "cn"

interface RemixIconProps extends React.HTMLAttributes<HTMLElement> {
  /** نام آیکون بدون پیشوند ri-، مثل "home-line" یا "bell-fill" (رجوع به assets/Icons/remixicon.css) */
  name: string
}

function RemixIcon({ name, className, ...props }: RemixIconProps) {
  return (
    <i
      data-slot="remix-icon"
      aria-hidden="true"
      className={cn(`ri-${name}`, "inline-block leading-none", className)}
      {...props}
    />
  )
}

export { RemixIcon }
