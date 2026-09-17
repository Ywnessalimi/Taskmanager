export type LoginInput = {
  identifier: string
  password: string
}

export type SignupInput = {
  fullName: string
  email: string
  phone: string
  password: string
}

/**
 * هنوز بک‌اند واقعی Auth وجود ندارد (رجوع به `getCurrentUser` در `users.ts`) — هر ورودی
 * پذیرفته می‌شود و کاربر مستقیم وارد اپ می‌شود. با آمدن بک‌اند Django جایگزین
 * POST /api/auth/login/ می‌شود، بدون تغییر در کامپوننت‌های مصرف‌کننده.
 */
export async function login(input: LoginInput): Promise<{ ok: true }> {
  console.info("login (هنوز بررسی نمی‌شود):", input)
  return { ok: true }
}

/** مشابه `login` — جایگزین POST /api/auth/signup/ خواهد شد. */
export async function signup(input: SignupInput): Promise<{ ok: true }> {
  console.info("signup (هنوز ذخیره نمی‌شود):", input)
  return { ok: true }
}
