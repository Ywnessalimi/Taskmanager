import ExcelJS from 'exceljs'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx'
import PDFDocument from 'pdfkit'
import { fileURLToPath } from 'node:url'
import { exportSchema } from './skills/registry.js'
import { DomainError } from '../tasks/task-service.js'
import { writePdfText } from './pdf-text.js'

export const reportColumns = {
  displayId: ['شناسه', 'ID'], title: ['عنوان', 'Title'], project: ['پروژه', 'Project'],
  assignees: ['مسئولان', 'Assignees'], status: ['وضعیت', 'Status'], priority: ['اولویت', 'Priority'],
  dueDate: ['سررسید شمسی', 'Jalali due date'], createdAt: ['تاریخ ساخت', 'Created at'], timeSpentMinutes: ['زمان مشترک تسک (دقیقه)', 'Shared task minutes'],
}
const statusLabels = { todo: 'در انتظار', 'in-progress': 'در حال انجام', completed: 'انجام‌شده' }
const priorityLabels = { none: 'بدون اولویت', low: 'کم', medium: 'متوسط', high: 'بالا', urgent: 'فوری' }

export async function exportReport(report, rawOptions) {
  const parsed = exportSchema.safeParse(rawOptions)
  if (!parsed.success) throw new DomainError(400, 'invalid_export', 'تنظیمات خروجی معتبر نیست.')
  const options = parsed.data
  const fa = options.locale === 'fa'
  const columns = [...new Set(options.columns ?? ['displayId', 'title', 'project', 'assignees', 'status', 'priority', 'dueDate'])]
  const title = options.title ?? report.title
  const rows = [...report.rows]
  if (options.sortBy) rows.sort((a, b) => String(a[options.sortBy] ?? '').localeCompare(String(b[options.sortBy] ?? ''), options.locale))
  const headings = columns.map(key => reportColumns[key][fa ? 0 : 1])
  const cell = (row, key) => {
    if (fa && key === 'status') return statusLabels[row.status] ?? row.status
    if (fa && key === 'priority') return priorityLabels[row.priority] ?? row.priority
    return row[key] ?? ''
  }
  const groups = new Map()
  for (const row of rows) {
    const key = options.groupBy === 'none' ? (fa ? 'جزئیات' : 'Details') : String(cell(row, options.groupBy))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  if (!groups.size) groups.set(fa ? 'جزئیات' : 'Details', [])
  const metadata = [title, `${fa ? 'زمان تهیه' : 'Generated'} ${report.generatedAt}`, ...report.limitations]
  let buffer
  if (options.format === 'csv') {
    // Prefix spreadsheet control characters so opening a CSV cannot evaluate user text.
    const escaped = value => `"${String(value).replace(/^[\s]*[=+@-]/, match => `'${match}`).replaceAll('"', '""')}"`
    const data = [headings, ...[...groups.values()].flat().map(row => columns.map(key => cell(row, key)))]
    buffer = Buffer.from('\uFEFF' + data.map(row => row.map(escaped).join(',')).join('\r\n'))
  }
  if (options.format === 'xlsx') {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Quire'
    workbook.created = new Date(report.generatedAt)
    const summary = workbook.addWorksheet(fa ? 'خلاصه' : 'Summary', { views: [{ rightToLeft: fa }] })
    metadata.forEach(line => summary.addRow([line]))
    summary.addRow([fa ? 'کل تسک‌ها' : 'Total tasks', report.summary.total])
    summary.addRow([fa ? 'در انتظار' : 'To do', report.summary.todo])
    summary.addRow([fa ? 'در حال انجام' : 'In progress', report.summary.inProgress])
    summary.addRow([fa ? 'انجام‌شده' : 'Completed', report.summary.completed])
    summary.getColumn(1).width = 80
    summary.getColumn(2).width = 16
    let sheetNumber = 0
    for (const [group, items] of groups) {
      const sheet = workbook.addWorksheet(`${++sheetNumber} ${group.replace(/[\\/*?:\[\]]/g, ' ')}`.slice(0, 31), { views: [{ rightToLeft: fa, state: 'frozen', ySplit: 1 }] })
      sheet.columns = columns.map((key, index) => ({ header: headings[index], key, width: key === 'title' ? 48 : 26 }))
      items.forEach(row => sheet.addRow(columns.map(key => cell(row, key))))
      sheet.getRow(1).font = { bold: true, name: 'Arial' }
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
      sheet.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true, readingOrder: fa ? 'rtl' : 'ltr' } })
    }
    buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  }
  if (options.format === 'docx') {
    const paragraph = (text, bold = false) => new Paragraph({ bidirectional: fa, children: [new TextRun({ text: String(text), bold, rightToLeft: fa, font: 'Arial', size: 20 })] })
    const children = metadata.map(line => paragraph(line))
    for (const [group, items] of groups) {
      children.push(paragraph(group, true))
      const data = [headings, ...items.map(row => columns.map(key => cell(row, key)))]
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: data.map((values, index) => new TableRow({ tableHeader: index === 0, children: (fa ? [...values].reverse() : values).map(value => new TableCell({ children: [paragraph(value, index === 0)] })) })) }))
    }
    buffer = await Packer.toBuffer(new Document({ sections: [{ properties: { page: { size: { orientation: 'landscape' } } }, children }] }))
  }
  if (options.format === 'pdf') {
    if (rows.length > 200) throw new DomainError(400, 'pdf_too_large', 'برای PDF محدوده را به حداکثر ۲۰۰ تسک محدود کنید.')
    buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 44, size: 'A4', info: { Title: title, Author: 'Quire' } })
      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      doc.font(fileURLToPath(new URL('./assets/IRANSansX-Regular.ttf', import.meta.url)))
      writePdfText(doc, title, { rtl: fa, size: 17 })
      doc.moveDown()
      writePdfText(doc, `${fa ? 'زمان تهیه' : 'Generated'}: \u2066${report.generatedAt}\u2069`, { rtl: fa, size: 9 })
      report.limitations.forEach(line => writePdfText(doc, line, { rtl: fa, size: 9 }))
      for (const [group, items] of groups) {
        doc.moveDown()
        writePdfText(doc, group, { rtl: fa, size: 13 })
        for (const row of items) {
          doc.moveDown()
          for (const key of columns) {
            const isolate = ['displayId', 'dueDate', 'createdAt', 'timeSpentMinutes'].includes(key) ? '\u2066' : '\u2068'
            writePdfText(doc, `${reportColumns[key][fa ? 0 : 1]}: ${isolate}${cell(row, key)}\u2069`, { rtl: fa })
          }
        }
      }
      doc.end()
    })
  }
  const types = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', csv: 'text/csv; charset=utf-8', pdf: 'application/pdf' }
  return { buffer, contentType: types[options.format], filename: `quire-report-${report.id.slice(0, 8)}.${options.format}` }
}
