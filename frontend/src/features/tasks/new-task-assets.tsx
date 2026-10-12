import Image from "next/image"

const SIZES = {
  "task-line": [16, 16], "folder-add-line": [16, 16], "chat-smile-line": [16, 16],
  "close-fill": [24, 24], "list-check3": [20, 20], "line25": [14.7648, 1],
  "filter3-fill": [20, 20], "notification4-line": [20, 20], "search2-line": [20, 20],
  "emoji-sticker-line": [21, 21], "send-plane2-fill": [20, 20], "attachment-line": [16, 16],
  "user-add-line": [16, 16], "heart3-line": [20, 20], "eye-line": [20, 20],
  "git-merge-line": [20, 20], "frame122": [40, 16], "flag-line": [16, 16],
  "price-tag3-line": [16, 16], "play-circle-fill": [24, 24], "timer-line": [16, 16],
  "calendar-todo-line": [16, 16], "calendar-check-line": [16, 16], "team-line": [16, 16],
  "line11": [661, 1], "attachment2": [16, 16], "arrow-down-sline": [20, 20],
  "git-branch-line": [16, 16], "history-line": [16, 16],
} as const

export type NewTaskAssetName = keyof typeof SIZES

/** SVGهای اصلی فیگما با اندازهٔ intrinsic خود؛ تصویر نمونهٔ اعضا با دادهٔ واقعی جایگزین می‌شود. */
export function NewTaskAsset({ name, className = "" }: { name: NewTaskAssetName; className?: string }) {
  const [width, height] = SIZES[name]
  return <Image src={`/images/figma/new-task/${name}.svg`} alt="" width={width} height={height} style={{ filter: "var(--task-workspace-icon-filter)" }} className={`shrink-0 max-w-none ${className}`} />
}
