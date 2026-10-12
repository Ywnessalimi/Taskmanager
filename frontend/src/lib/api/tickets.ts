import type { NewTicketInput } from "./types"

/** قرارداد ساخت تیکت؛ مثل ساخت تسک در فاز فعلی ذخیرهٔ سروری ندارد. */
export async function createTicket(input: NewTicketInput): Promise<void> {
  console.info("createTicket (demo, not persisted):", input)
}
