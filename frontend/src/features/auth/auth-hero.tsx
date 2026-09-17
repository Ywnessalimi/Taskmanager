import Image from "next/image"
import { t, type Locale } from "@/lib/i18n/dictionary"
import { AuthHeroBoard } from "./auth-hero-board"

/** پنل دکوراتیو سمت دسکتاپ (`lg` به بالا) — عکس زمینه + برند + پیش‌نمایش برد کانبان. */
export function AuthHero({ locale, imageSrc }: { locale: Locale; imageSrc: string }) {
  return (
    <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#ededed] lg:flex">
      <Image src={imageSrc} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="relative z-10 flex flex-col items-center gap-16 px-10">
        <p
          dir="ltr"
          aria-label={t(locale, "auth.poweredBy")}
          className="flex items-center gap-3.5 whitespace-nowrap text-white"
        >
          <span aria-hidden className="text-xl">
            Power by
          </span>
          <span aria-hidden className="text-[34px]">
            Quire
          </span>
        </p>
        <AuthHeroBoard />
      </div>
    </div>
  )
}
