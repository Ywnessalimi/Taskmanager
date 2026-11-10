import { extname } from 'node:path'
import { TextDecoder } from 'node:util'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import ExcelJS from 'exceljs'
import yauzl from 'yauzl'
import { DomainError } from '../tasks/task-service.js'

export const attachmentLimits = Object.freeze({ bytes: 3_000_000, characters: 8000 })

function checkOfficeArchive(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, archive) => {
      if (error) return reject(error)
      let entries = 0, size = 0
      archive.on('error', reject)
      archive.on('entry', entry => {
        entries++
        size += entry.uncompressedSize
        if (entries > 1000 || size > 20_000_000) {
          archive.close()
          return reject(new Error('Office archive too large'))
        }
        archive.readEntry()
      })
      archive.on('end', resolve)
      archive.readEntry()
    })
  })
}

export async function extractAttachmentText(filename, buffer) {
  const extension = extname(filename).toLowerCase()
  if (!['.txt', '.md', '.csv', '.json', '.pdf', '.docx', '.xlsx'].includes(extension)) {
    throw new DomainError(400, 'unsupported_attachment', 'این نوع فایل پشتیبانی نمی‌شود. فایل متنی، PDF، DOCX یا XLSX انتخاب کنید.')
  }
  if (!buffer.length || buffer.length > attachmentLimits.bytes) throw new DomainError(400, 'invalid_attachment_size', 'اندازهٔ فایل باید بیشتر از صفر و حداکثر ۳ مگابایت باشد.')
  let text
  try {
    if (extension === '.pdf') {
      const parser = new PDFParse({ data: buffer })
      try {
        const info = await parser.getInfo()
        if (info.total > 40) throw new Error('PDF too long')
        text = (await parser.getText()).text
      } finally { await parser.destroy() }
    } else if (extension === '.docx') {
      await checkOfficeArchive(buffer)
      text = (await mammoth.extractRawText({ buffer })).value
    } else if (extension === '.xlsx') {
      await checkOfficeArchive(buffer)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const lines = []
      let length = 0
      for (const sheet of workbook.worksheets) {
        lines.push(`Sheet: ${sheet.name}`)
        sheet.eachRow(row => {
          if (length > attachmentLimits.characters) return
          const line = row.values.slice(1).map(value => {
            if (value == null) return ''
            if (typeof value === 'object') return value.text ?? value.result ?? (value.richText ? value.richText.map(part => part.text).join('') : '')
            return String(value)
          }).join('\t')
          length += line.length + 1
          lines.push(line)
        })
      }
      text = lines.join('\n')
    } else {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    }
  } catch {
    throw new DomainError(400, 'invalid_attachment', 'خواندن فایل ممکن نیست؛ فایل سالم، بدون رمز و دارای متن انتخاب کنید.')
  }
  text = text.trim()
  if (!text) throw new DomainError(400, 'empty_attachment', 'متن قابل خواندنی در فایل پیدا نشد.')
  if (text.length > attachmentLimits.characters) throw new DomainError(400, 'attachment_text_too_long', 'متن فایل بیش از ۸۰۰۰ نویسه است؛ بخش کوچک‌تری انتخاب کنید.')
  return text
}
