import Image from "next/image"

const SIZES = { more: [20,20], search: [20,20], divider: [14,1], down: [24,24], up: [24,24], back: [20,20], "status-divider": [12,1], "status-chevron": [16,16], completed: [24,24], urgent: [16,16], play: [24,24], "start-calendar": [16,16], "due-calendar": [16,16], activities: [16,16], details: [16,16], create: [20,20], close: [20,20] } as const
export function MobileTaskAsset({ name, className = "" }: { name: keyof typeof SIZES; className?: string }) {
  const [width,height] = SIZES[name]
  return <Image src={`/images/figma/mobile-task/${name}.svg`} alt="" width={width} height={height} className={`shrink-0 max-w-none ${className}`} />
}
