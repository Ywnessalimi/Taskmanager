# Projects app

پایداری صفحهٔ سند و پیام‌های چت وابسته به پروژه را در SQLite فراهم می‌کند. به جدول مرجع `projects` و migration `005_project_pages_and_chat.sql` وابسته است؛ `server.js` مسیرهای API را مصرف می‌کند. هر پروژه حداکثر یک سند و یک چت دارد. رابط `ProjectSectionTabs`، `DocumentPage` و `ChatPage` از این API استفاده می‌کنند.
