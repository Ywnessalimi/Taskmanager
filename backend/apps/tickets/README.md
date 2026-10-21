# tickets

این اپ رکوردهای تیکت، کامنت‌ها و رویدادهای فعالیت تیکت را در SQLite نگه می‌دارد. Ticket با شناسهٔ پایدار فرانت/سرور ذخیره می‌شود و Activity شامل ساخت، تغییر وضعیت، ارجاع، اولویت، فالو، علاقه‌مندی و کامنت است. `GET /tickets/inbox` تیکت‌های ساخته‌شده یا ارجاع‌شده به کاربر جاری را می‌دهد. شناسهٔ ارجاع‌گیرنده در برابر کاربران واقعی و عضویت پروژه اعتبارسنجی می‌شود و ارجاع تازه از Notifications اعلان می‌سازد. اولویت اختیاری تیکت با مقادیر `none`, `low`, `medium`, `high`, `urgent` در بدنهٔ JSON نگه‌داری می‌شود.

وابستگی‌ها: `database.js` برای اتصال/migration، `server.js` برای HTTP و migrationهای `003_ticket_comments.sql` و `004_tickets_and_activity.sql`. repositoryهای `ticket-comment-repository.js` و `ticket-repository.js` SQL و تبدیل سطرها به قرارداد JSON را محصور می‌کنند.

مصرف‌کننده‌ها: مسیرهای احراز‌شدهٔ `/api/v1/tickets`، `/tickets/inbox`، `/tickets/:ticketId`، `/activity` و `/comments` در `server.js` و لایهٔ `frontend/src/lib/api/`. هویت سازنده/عامل از نشست معتبر می‌آید و زمان رویدادها در سرور تولید می‌شود. Activity به ترتیب قدیمی به جدید برمی‌گردد.
