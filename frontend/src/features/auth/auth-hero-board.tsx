import { cn } from "cn"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { RemixIcon } from "@/components/ui/remix-icon"

type HeroTagVariant = "success" | "error" | "brand"

type HeroCardTag = {
  label: string
  icon: string
  variant: HeroTagVariant
}

type HeroCard = {
  title: string
  assignee?: { name: string; avatars: string[] }
  icons?: string[]
  tags?: HeroCardTag[]
}

type HeroColumn = {
  index: string
  label: string
  dotColor: string
  cards: HeroCard[]
}

/**
 * محتوای این ستون‌ها دقیقاً از طرح Figma کپی شده (همان اسم‌های تسک/اعضا) — چون کاملاً
 * دکوراتیو است (پیش‌نمایش برد کانبان روی پس‌زمینه‌ی صفحه‌ی ورود، نه داده‌ی واقعی)، مثل
 * بقیه‌ی داده‌های Mock در این اپ به‌جای دیکشنری i18n به فارسی هاردکد شده — رجوع به
 * README همین پوشه.
 */
const HERO_COLUMNS: HeroColumn[] = [
  {
    index: "۱",
    label: "به تعویق افتاده",
    dotColor: "#dc575a",
    cards: [
      {
        title: "طراحی صفحه لندینگ",
        icons: ["user-add-line", "file-text-line", "calendar-todo-fill", "arrow-up-double-line"],
      },
    ],
  },
  {
    index: "۳",
    label: "در حال انجام",
    dotColor: "#57a8dc",
    cards: [
      {
        title: "صفحه مشتریان",
        assignee: { name: "ماهین رضایی", avatars: ["/avatars/u2.svg"] },
        icons: ["file-text-line", "calendar-todo-fill", "arrow-up-double-line"],
      },
      {
        title: "ساخت بخش تیکت",
        assignee: { name: "دو کاربر", avatars: ["/avatars/u3.svg", "/avatars/u4.svg"] },
        tags: [
          { label: "۱ فایل", icon: "file-text-line", variant: "success" },
          { label: "خیلی فوری", icon: "arrow-up-double-line", variant: "error" },
          { label: "۱۲/۰۶", icon: "calendar-todo-fill", variant: "brand" },
        ],
      },
      {
        title: "دلیل کندی ساتی",
        icons: ["user-add-line", "file-text-line"],
        tags: [
          { label: "خیلی فوری", icon: "arrow-up-double-line", variant: "error" },
          { label: "۱۲/۰۶", icon: "calendar-todo-fill", variant: "brand" },
        ],
      },
    ],
  },
  {
    index: "۲",
    label: "در حال انجام",
    dotColor: "#379d65",
    cards: [
      {
        title: "توسعه زیر ساخت فنی",
        icons: ["user-add-line", "file-text-line", "calendar-todo-fill", "arrow-up-double-line"],
      },
      {
        title: "اتصال به API خرید",
        assignee: { name: "ماهین رضایی", avatars: ["/avatars/u2.svg"] },
        icons: ["file-text-line", "calendar-todo-fill", "arrow-up-double-line"],
      },
    ],
  },
]

const TAG_VARIANT_CLASS: Record<HeroTagVariant, string> = {
  success: "bg-[rgba(201,246,208,0.3)] text-[#3e9f6a]",
  error: "bg-[rgba(246,201,201,0.3)] text-[#dc6060]",
  brand: "bg-[#e6ecff] text-[var(--auth-brand)]",
}

/** پیش‌نمایش دکوراتیو یک برد کانبان، پشت شیشه‌ای (backdrop-blur) روی عکس زمینه‌ی دسکتاپ. */
export function AuthHeroBoard() {
  return (
    <div className="hidden gap-6 xl:flex">
      {HERO_COLUMNS.map((column) => (
        <HeroColumnView key={column.label + column.index} column={column} />
      ))}
    </div>
  )
}

function HeroColumnView({ column }: { column: HeroColumn }) {
  return (
    <div className="flex w-[260px] flex-col overflow-hidden rounded-2xl bg-[rgba(245,245,245,0.8)] backdrop-blur-[30px]">
      <div className="flex items-center justify-end gap-2 px-4 pt-4 pb-1">
        <span className="flex items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-semibold text-black">
          {column.index}
        </span>
        <span className="text-sm font-medium text-[#141a1a]">{column.label}</span>
        <span className="h-[17px] w-2 shrink-0 rounded-full" style={{ backgroundColor: column.dotColor }} />
      </div>
      <div className="flex flex-col gap-2 p-2">
        {column.cards.map((card) => (
          <HeroCardView key={card.title} card={card} />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 px-4 pt-1 pb-4 text-sm text-[#79817f]">
        <span>تسک جدید</span>
        <RemixIcon name="add-line" className="text-lg" />
      </div>
    </div>
  )
}

function HeroCardView({ card }: { card: HeroCard }) {
  return (
    <div className="flex flex-col items-end rounded-2xl border border-[#eaeded] bg-white px-3 py-1">
      <p className="w-full py-2 text-center text-sm font-semibold text-[#141a1a]">{card.title}</p>
      {card.assignee && (
        <div className="flex items-center gap-1 rounded-full bg-[#fafafa] py-0.5 ps-1 pe-2">
          {card.assignee.avatars.map((src, i) => (
            <Avatar key={src} size="sm" className={cn("size-5", i > 0 && "-ms-2")}>
              <AvatarImage src={src} alt="" />
            </Avatar>
          ))}
          <span className="text-[11px] font-semibold text-[#515e5e]">{card.assignee.name}</span>
        </div>
      )}
      {card.icons && (
        <div className="flex items-center gap-2 py-2 text-base text-[#79817f]">
          {card.icons.map((icon) => (
            <RemixIcon key={icon} name={icon} />
          ))}
        </div>
      )}
      {card.tags && (
        <div className="flex items-center gap-2 py-2">
          {card.tags.map((tag) => (
            <span
              key={tag.label}
              className={cn(
                "flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-bold",
                TAG_VARIANT_CLASS[tag.variant]
              )}
            >
              {tag.label}
              <RemixIcon name={tag.icon} className="text-sm" />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
