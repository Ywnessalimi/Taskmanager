import ExcelJS from 'exceljs'
import JSZip from 'jszip'

export const assistantAttachmentLimits = Object.freeze({
  maxFiles: 3,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 4 * 1024 * 1024,
  maxExtractedCharacters: 10_000,
})

const supportedExtensions = new Set(['xlsx', 'docx', 'csv', 'txt', 'md', 'json'])

export class AssistantAttachmentError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function extensionOf(name) {
  return String(name).split('.').at(-1)?.toLowerCase() ?? ''
}

function decodeXml(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, token) => {
    if (token[0] === '#') {
      const codePoint = token[1]?.toLowerCase() === 'x' ? Number.parseInt(token.slice(2), 16) : Number.parseInt(token.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity
    }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[token.toLowerCase()] ?? entity
  })
}

async function validateArchive(buffer) {
  let archive
  try {
    archive = await JSZip.loadAsync(buffer, { checkCRC32: false })
  } catch {
    throw new AssistantAttachmentError('invalid_attachment', 'یکی از فایل‌های فشرده معتبر نیست.')
  }

  const entries = Object.values(archive.files).filter(file => !file.dir)
  if (entries.length > 500) throw new AssistantAttachmentError('attachment_too_complex', 'تعداد بخش‌های فایل بیش از حد مجاز است.')
  const expandedSize = entries.reduce((sum, file) => sum + (file._data?.uncompressedSize ?? 0), 0)
  if (expandedSize > 12 * 1024 * 1024 || entries.some(file => (file._data?.uncompressedSize ?? 0) > 4 * 1024 * 1024)) {
    throw new AssistantAttachmentError('attachment_too_complex', 'اندازهٔ بازشدهٔ فایل بیش از حد مجاز است.')
  }
  return archive
}

async function readDocx(buffer) {
  const archive = await validateArchive(buffer)
  const document = archive.file('word/document.xml')
  if (!document) throw new AssistantAttachmentError('invalid_docx', 'محتوای فایل Word خوانده نشد.')
  const xml = await document.async('string')
  return decodeXml(xml
    .replace(/<w:tab\b[^>]*\/?\s*>/g, '\t')
    .replace(/<w:br\b[^>]*\/?\s*>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, ''))
}

async function readXlsx(buffer) {
  await validateArchive(buffer)
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(buffer)
  } catch {
    throw new AssistantAttachmentError('invalid_xlsx', 'محتوای فایل Excel خوانده نشد.')
  }
  return workbook.worksheets.map(sheet => {
    const rows = []
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 300) return
      rows.push(row.values.slice(1, 51).map(value => String(value?.text ?? value?.result ?? value ?? '')).join('\t'))
    })
    return `Sheet: ${sheet.name}\n${rows.join('\n')}`
  }).join('\n\n')
}

export async function readAssistantAttachments(input) {
  if (input === undefined) return ''
  if (!Array.isArray(input) || input.length > assistantAttachmentLimits.maxFiles) {
    throw new AssistantAttachmentError('invalid_attachments', 'حداکثر سه فایل را پیوست کنید.')
  }

  let totalBytes = 0
  const documents = []
  for (const attachment of input) {
    if (!attachment || typeof attachment.name !== 'string' || typeof attachment.data !== 'string') {
      throw new AssistantAttachmentError('invalid_attachment', 'اطلاعات یکی از فایل‌های پیوست معتبر نیست.')
    }
    const extension = extensionOf(attachment.name)
    if (!supportedExtensions.has(extension)) {
      throw new AssistantAttachmentError('unsupported_attachment', `قالب فایل «${attachment.name}» پشتیبانی نمی‌شود.`)
    }
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(attachment.data)) {
      throw new AssistantAttachmentError('invalid_attachment', 'دادهٔ یکی از فایل‌های پیوست معتبر نیست.')
    }
    const buffer = Buffer.from(attachment.data, 'base64')
    if (!buffer.length || buffer.length > assistantAttachmentLimits.maxFileBytes) {
      throw new AssistantAttachmentError('attachment_size_limit', 'هر فایل باید کوچک‌تر از ۲ مگابایت باشد.')
    }
    totalBytes += buffer.length
    if (totalBytes > assistantAttachmentLimits.maxTotalBytes) {
      throw new AssistantAttachmentError('attachment_total_limit', 'حجم مجموع فایل‌ها نباید از ۴ مگابایت بیشتر شود.')
    }

    let content
    if (extension === 'xlsx') content = await readXlsx(buffer)
    else if (extension === 'docx') content = await readDocx(buffer)
    else content = buffer.toString('utf8')
    documents.push({ name: attachment.name.replace(/[\r\n\t<>]/g, ' ').slice(0, 120), content })
  }

  const combined = documents.map(({ name, content }) => `--- Attached file: ${name} ---\n${content}`).join('\n\n')
  if (combined.length > assistantAttachmentLimits.maxExtractedCharacters) {
    throw new AssistantAttachmentError('attachment_text_limit', 'متن استخراج‌شده از فایل‌ها بیش از حد مجاز است؛ فایل کوچک‌تر یا تعداد کمتری انتخاب کنید.')
  }
  return combined
}
