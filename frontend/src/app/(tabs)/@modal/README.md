# @modal

این parallel route در App Router جزئیات تیکت را هنگام ناوبری نرم به شکل مودال روی صفحهٔ قبلی نگه می‌دارد. مسیر `(.)inbox/[ticketId]` به `TicketDetail` وصل است و `default.tsx` در مسیرهای دیگر slot را خالی نگه می‌دارد.

وابستگی‌ها: `features/tickets/ticket-detail.tsx` و slot `modal` در `app/(tabs)/layout.tsx`.

مصرف‌کننده‌ها: پیوند تیکت در Inbox و کارت‌های تیکت در Board؛ مسیر مستقیم `/inbox/[ticketId]` نیز صفحهٔ اصلی خودش را دارد.


مسیرهای جزئیات hierarchy نیز به همین slot متصل‌اند: (.)o/[organizationSlug] و (.)home/organizations/[id] برای سازمان/معاونت. مسیر شناسه‌محور (.)home/projects/[id] جزئیات پروژه را در WorkspaceRouteModal باز می‌کند. مسیر خوانای `/o/[organizationSlug]/[projectSlug]` صفحهٔ مستقل پروژه است و از این slot استفاده نمی‌کند. WorkspaceRouteModal قاب taskWorkspace را فراهم می‌کند.
