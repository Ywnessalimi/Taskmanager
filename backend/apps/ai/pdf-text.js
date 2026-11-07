import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const features = ['rlig', 'liga']

// Font shaping is done per directional run; reversing a whole Persian line
// also reverses Latin IDs, numbers and dates.
export function pdfTextRuns(text, direction = 'rtl') {
  const embedding = bidi.getEmbeddingLevels(text, direction)
  const indices = bidi.getReorderedIndices(text, embedding)
  const rank = new Map(indices.map((index, position) => [index, position]))
  const runs = []
  for (let start = 0; start < text.length;) {
    let end = start + 1
    while (end < text.length && embedding.levels[end] === embedding.levels[start]) end++
    runs.push({ text: text.slice(start, end), rank: Math.min(...Array.from({ length: end - start }, (_, index) => rank.get(start + index))) })
    start = end
  }
  return runs.sort((a, b) => a.rank - b.rank).map(run => run.text.replace(/[\u202a-\u202e\u2066-\u2069]/g, '')).filter(Boolean)
}

export function writePdfText(doc, value, { rtl = true, size = 10 } = {}) {
  doc.fontSize(size)
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const direction = rtl ? 'rtl' : 'ltr'
  const measure = text => pdfTextRuns(text, direction).reduce((total, run) => total + doc.widthOfString(run, { features }), 0)
  const draw = text => {
    const height = doc.currentLineHeight(true) + 4
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage()
    const y = doc.y
    const runs = pdfTextRuns(text.trimEnd(), direction)
    const widths = runs.map(run => doc.widthOfString(run, { features }))
    let x = rtl ? doc.page.width - doc.page.margins.right - widths.reduce((a, b) => a + b, 0) : doc.page.margins.left
    runs.forEach((run, index) => { doc.text(run, x, y, { lineBreak: false, features }); x += widths[index] })
    doc.x = doc.page.margins.left
    doc.y = y + height
  }
  for (const paragraph of String(value).split(/\r?\n/)) {
    let line = ''
    for (const word of paragraph.match(/\S+\s*|\s+/g) ?? []) {
      if (line && measure(line + word) > width) { draw(line); line = '' }
      if (measure(word) <= width) line += word
      else {
        for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)) {
          if (line && measure(line + segment) > width) { draw(line); line = '' }
          line += segment
        }
      }
    }
    draw(line)
  }
}
