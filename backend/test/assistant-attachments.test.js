import test from 'node:test'
import assert from 'node:assert/strict'
import PDFDocument from 'pdfkit'
import { Document, Packer, Paragraph } from 'docx'
import ExcelJS from 'exceljs'
import { extractAttachmentText } from '../apps/ai/attachment-text.js'

async function pdfFixture() {
  const doc = new PDFDocument()
  const chunks = []
  doc.on('data', chunk => chunks.push(chunk))
  const finished = new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject) })
  doc.text('Sample PDF task')
  doc.end()
  await finished
  return Buffer.concat(chunks)
}

test('extracts text from supported files', async () => {
  assert.equal(await extractAttachmentText('note.txt', Buffer.from('سلام دنیا')), 'سلام دنیا')
  assert.match(await extractAttachmentText('report.pdf', await pdfFixture()), /Sample PDF task/)
  const word = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph('Word task')] }] }))
  assert.match(await extractAttachmentText('report.docx', word), /Word task/)
  const workbook = new ExcelJS.Workbook()
  workbook.addWorksheet('Tasks').addRow(['Task', 'Status'])
  const spreadsheet = Buffer.from(await workbook.xlsx.writeBuffer())
  assert.match(await extractAttachmentText('report.xlsx', spreadsheet), /Task\tStatus/)
})

test('rejects unsupported, corrupt, empty and oversized content', async () => {
  await assert.rejects(extractAttachmentText('image.png', Buffer.from('data')), { code: 'unsupported_attachment' })
  await assert.rejects(extractAttachmentText('bad.docx', Buffer.from('data')), { code: 'invalid_attachment' })
  await assert.rejects(extractAttachmentText('empty.txt', Buffer.from(' ')), { code: 'empty_attachment' })
  await assert.rejects(extractAttachmentText('long.txt', Buffer.from('x'.repeat(8001))), { code: 'attachment_text_too_long' })
  await assert.rejects(extractAttachmentText('big.txt', Buffer.alloc(3_000_001)), { code: 'invalid_attachment_size' })
})
