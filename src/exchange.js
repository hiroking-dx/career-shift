import { schema } from './model.js'

export function analysisPrompt(row                         = {}) {
  const fields = Object.fromEntries(schema.analysis.map(f => [f.key, row[f.key] || '']))
  return [
    '転職に向けて自己分析を手伝ってください。経験の裏付けが足りない場合は先に質問してください。事実を補わず、不明な項目は空欄にしてください。',
    '最後にCareer Shift.に取り込めるJSONオブジェクトを1件返してください。',
    schema.analysis.map(f => f.key + '＝' + f.label).join('、'),
    JSON.stringify(fields, null, 2),
  ].join('\n\n')
}

export function analysisReply(input        )                         {
  if (input.length > 60000) throw Error('回答が長すぎます。自己分析を1件ずつ取り込んでください。')
  const data = JSON.parse(input.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1'))
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      Object.keys(data).some(k => !schema.analysis.some(f => f.key === k)) ||
      typeof data.name !== 'string' || !data.name.trim())
    throw Error('テーマ（name）を含む自己分析用のJSONを貼り付けてください。')
  return Object.fromEntries(schema.analysis.map(f => {
    const value = data[f.key] ?? ''
    if (typeof value !== 'string' || value.length > (f.key === 'name' ? 200 : 4000))
      throw Error('各項目の文字数と内容を確認してください。')
    return [f.key, value.trim()]
  }))
}
