import {
  agenda,
  dayNo,
  iso,
  improvement,
  schema,
             
            
           
} from './model.js'
export const esc = (s          = '') =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] )
  )
export const yen = (n        ) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n)
export function download(name        , data        , mime        ) {
  const url = URL.createObjectURL(new Blob([data], { type: mime })),
    a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
export function markdown(text        ) {
  return text
    .split('\n')
    .map((line) => {
      let t = esc(line)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      if (/^#{1,6} /.test(t)) return '<h4>' + t.replace(/^#{1,6} /, '') + '</h4>'
      if (/^[-*] /.test(t)) t = '• ' + t.slice(2)
      return '<div>' + (t || '<br>') + '</div>'
    })
    .join('')
}
export function resume(r     , md         ) {
  const i = improvement(r)
  return (
    (md ? '## ' : '') +
    r.name +
    '\n' +
    schema.wins
      .filter((f) => f.key !== 'name' && r[f.key])
      .map((f) => (md ? '- ' : '') + f.label + '：' + r[f.key])
      .join('\n') +
    '\n削減時間：' +
    i.minutes +
    '分／回、削減率：' +
    i.percent +
    '%、年間削減工数：' +
    i.hours.toFixed(1) +
    '時間'
  )
}
export function csv(s       ) {
  const rows             = [['区分', 'ID', '項目', '値']]
  for (const k of Object.keys(schema)          )
    for (const r of s.rows[k])
      for (const f of schema[k]) rows.push([k, r.id, f.label, r[f.key]])
  for (const k of ['settings', 'money']         )
    for (const [key, value] of Object.entries(s[k])) rows.push([k, '', key, value])
  for (const h of s.history) rows.push(['貯金履歴', '', h.day, String(h.value)])
  return (
    '\ufeff' +
    rows
      .map((r) =>
        r
          .map((x) => '"' + (/^[=+@\-\t\r]/.test(x) ? "'" : '') + x.replace(/"/g, '""') + '"')
          .join(',')
      )
      .join('\r\n')
  )
}
const ic = (s        ) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/[,;]/g, (x) => '\\' + x)
function fold(line        ) {
  const enc = new TextEncoder()
  let out = '',
    len = 0
  for (const char of line) {
    const n = enc.encode(char).length
    if (len + n > 75) {
      out += '\r\n '
      len = 1
    }
    out += char
    len += n
  }
  return out
}
export function calendarFile(s       ) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Career Shift//Calendar//JA',
    'CALSCALE:GREGORIAN',
  ]
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  for (const e of agenda(s)) {
    const d = e.date.replace(/-/g, '')
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + e.k + '-' + e.r.id + '-' + encodeURIComponent(e.type) + '@career-shift.local',
      'DTSTAMP:' + stamp,
      e.time ? 'DTSTART:' + d + 'T' + e.time.replace(':', '') + '00' : 'DTSTART;VALUE=DATE:' + d
    )
    if (!e.time) lines.push('DTEND;VALUE=DATE:' + iso(dayNo(e.date) + 1).replace(/-/g, ''))
    lines.push('SUMMARY:' + ic(e.r.name + '（' + e.type + '）'), 'END:VEVENT')
  }
  return [...lines, 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n'
}
