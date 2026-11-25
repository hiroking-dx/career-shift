                                                                                         
                                                                       
                                                                                    
export const field = (
  key        ,
  label        ,
  type = 'text',
  options           
)        => ({ key, label, type, options })
const select = (k        , l        , o          ) => field(k, l, 'select', o)
const date = (k        , l        ) => field(k, l, 'date')
const num = (k        , l        ) => field(k, l, 'number')
const area = (k        , l        ) => field(k, l, 'textarea')
const name = (l        ) => field('name', l)
const note = area('memo', 'メモ')
export const statuses = ['未着手', '進行中', '保留', '完了']
export const stages = [
  '気になる企業',
  '応募検討中',
  '応募済み',
  '書類選考',
  '一次面接',
  '二次面接',
  '最終面接',
  '内定',
  '内定承諾',
  '辞退',
  '不採用',
]
export const cats = ['準備', '学習', '書類', '応募・選考', '新生活']
export const colors = ['#398d80', '#7085b3', '#a084aa', '#cb8848', '#768d55']
const category = select('cat', 'カテゴリー', cats)
const progress = field('progress', '進捗率（%）', 'percent')
export const schema                        = {
  road: [
    name('工程名'),
    category,
    date('start', '開始日'),
    date('end', '終了日'),
    progress,
    select('milestone', 'マイルストーン', ['いいえ', 'はい']),
  ],
  tasks: [
    name('タスク名'),
    category,
    date('start', '開始日'),
    date('end', '期限'),
    select('priority', '優先度', ['中', '高', '低']),
    select('status', 'ステータス', statuses),
    progress,
    note,
    area('subs', 'サブタスク（1行に1件、完了は [x] を先頭に入力）'),
  ],
  events: [
    name('予定名'),
    select('cat', '予定の種類', [
      '面接',
      'エージェント面談',
      '応募期限',
      '書類提出期限',
      '資格試験',
      '学習予定',
      '退職手続き',
      '引っ越し',
      'その他',
    ]),
    date('start', '予定日'),
    field('time', '開始時刻', 'time'),
    note,
  ],
  companies: [
    name('企業名'),
    field('industry', '業界'),
    field('role', '職種'),
    field('place', '勤務地'),
    field('url', '求人URL', 'url'),
    num('salary', '想定年収（万円）'),
    num('base', '基本給（月額・万円）'),
    field('bonus', '賞与'),
    num('holidays', '年間休日（日）'),
    num('hours', '月平均残業時間'),
    select('remote', 'リモートワーク', ['未確認', '可', '一部可', '不可']),
    field('housing', '住宅手当'),
    field('moving', '引っ越し補助'),
    date('applied', '応募日'),
    date('deadline', '応募期限'),
    date('interview', '面接予定日'),
    field('time', '面接開始時刻', 'time'),
    select('interest', '志望度', ['中', '高', '低']),
    select('status', '選考状況', stages),
    field('contact', '担当者情報'),
    area('discussion', '面接内容'),
    note,
  ],
  wins: [
    name('実績名'),
    date('start', '開始日'),
    date('end', '終了日'),
    area('issue', '背景・課題'),
    area('before', '改善前の状況'),
    area('action', '実施した内容'),
    field('tech', '使用技術'),
    area('after', '改善後の状況'),
    num('old', '改善前（分／人・回）'),
    num('now', '改善後（分／人・回）'),
    num('freq', '作業頻度（回／人・年）'),
    num('people', '利用人数'),
    area('effect', '成果・効果'),
    field('ref', '参考資料'),
    field('url', '関連URL', 'url'),
  ],
  study: [
    name('資格名'),
    area('content', '学習内容'),
    date('start', '学習開始日'),
    date('exam', '試験予定日'),
    num('goal', '目標学習時間'),
    num('actual', '実際の学習時間'),
    select('status', '取得状況', ['学習中', '受験予定', '結果待ち', '取得済み']),
    note,
  ],
  notes: [
    name('タイトル'),
    area('body', '本文（Markdown）'),
    field('tags', 'タグ（カンマ区切り）'),
    select('pin', 'ピン留め', ['いいえ', 'はい']),
    field('company', '関連企業', 'company'),
    field('task', '関連タスク', 'task'),
  ],
}
export const settingsFields = [
  date('target', '転職予定日'),
  field('joined', '入社年月', 'month'),
  field('job', '現在の職種'),
  field('desired', '希望職種'),
  field('housing', '住居・退去予定'),
  field('household', '同居予定'),
  select('theme', '外観', ['端末に合わせる', 'ライト', 'ダーク']),
]
export const moneyFields = [
  num('cash', '現在の貯金額'),
  num('goal', '目標貯金額'),
  num('monthly', '毎月の貯金予定額'),
  num('bonus', '転職までのボーナス貯金予定額'),
  num('retire', '退職金見込み'),
  num('benefit', '給付金見込み'),
  num('goods', '家具・家電購入費'),
  num('rent', '賃貸契約初期費用'),
  num('move', '引っ越し費用'),
  num('reserve', '生活防衛資金'),
  field('share', '新生活費の本人負担率（%）', 'percent'),
]
export const kinds = Object.keys(schema)          
                     
            
                                  
                               
                           
                                           
 
export const localDay = (d = new Date()) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
export const dayNo = (d        ) => Date.parse(d + 'T00:00:00Z') / 86400000
export const iso = (n        ) => new Date(n * 86400000).toISOString().slice(0, 10)
export function defaults(fs         ) {
  return Object.fromEntries(
    fs.map((f) => [
      f.key,
      f.options?.[0] ?? (['number', 'percent'].includes(f.type) ? '0' : ''),
    ])
  )                          
}
export function fresh()        {
  const settings = defaults(settingsFields),
    money = defaults(moneyFields)
  settings.target = '2027-09-01'
  money.goal = '1200000'
  money.share = '100'
  const rows = Object.fromEntries(kinds.map((k) => [k, []]))                            
  const plan = [
    ['自己分析・業界研究', '2026-11-01', '2026-12-31', 0],
    ['スキルアップ・業務改善実績の整理', '2027-01-01', '2027-03-31', 1],
    ['ポートフォリオ作成', '2027-02-01', '2027-03-31', 2],
    ['履歴書・職務経歴書作成', '2027-04-01', '2027-05-31', 2],
    ['転職エージェント登録・面談', '2027-04-01', '2027-05-31', 3],
    ['求人応募・面接', '2027-06-01', '2027-07-31', 3],
    ['内定獲得・労働条件確認', '2027-07-01', '2027-08-31', 3],
    ['退職手続き・引っ越し準備', '2027-08-01', '2027-08-31', 4],
    ['転職・新生活開始', '2027-09-01', '2027-09-01', 4],
  ]         
  rows.road = plan.map(([name, start, end, i], j) => ({
    ...defaults(schema.road),
    id: 'phase-' + j,
    name,
    start,
    end,
    cat: cats[i],
    milestone: j === 8 ? 'はい' : 'いいえ',
  }))
  return { version: 1, settings, money, rows, history: [] }
}
export function finance(s       , today = localDay()) {
  const m = (k        ) => Number(s.money[k])
  const target = s.settings.target
  const months = Math.max(
    0,
    (+target.slice(0, 4) - +today.slice(0, 4)) * 12 + (+target.slice(5, 7) - +today.slice(5, 7))
  )
  const cash = m('cash'),
    goal = m('goal'),
    planned = cash + months * m('monthly') + (target >= today ? m('bonus') : 0),
    uncertain = m('retire') + m('benefit'),
    cost = ((m('goods') + m('rent') + m('move')) * m('share')) / 100
  return {
    months,
    cash,
    goal,
    planned,
    uncertain,
    cost,
    remaining: planned - cost,
    available: planned - cost - m('reserve'),
    gap: Math.max(0, goal - cash),
    need: months ? Math.max(0, Math.ceil((goal - cash - m('bonus')) / months)) : null,
    rate: goal ? Math.round((100 * cash) / goal) : 0,
  }
}
export const improvement = (r     ) => ({
  minutes: +r.old - +r.now,
  percent: +r.old ? Math.round((1 - +r.now / +r.old) * 100) : 0,
  hours: ((+r.old - +r.now) * +r.freq * +r.people) / 60,
})
export function progressOf(s       ) {
  const all = [...s.rows.tasks, ...s.rows.road]
  return all.length
    ? Math.round(all.reduce((a, r) => a + Number(r.progress), 0) / all.length)
    : 0
}
export function agenda(s       ) {
  return [
    ...s.rows.events.map((r) => ({
      k: 'events'        ,
      r,
      date: r.start,
      time: r.time,
      type: r.cat,
    })),
    ...s.rows.tasks.map((r) => ({
      k: 'tasks'        ,
      r,
      date: r.end,
      time: '',
      type: 'タスク期限',
    })),
    ...s.rows.companies.flatMap((r) => [
      { k: 'companies'        , r, date: r.interview, time: r.time, type: '面接' },
      { k: 'companies'        , r, date: r.deadline, time: '', type: '応募期限' },
    ]),
    ...s.rows.study.map((r) => ({
      k: 'study'        ,
      r,
      date: r.exam,
      time: '',
      type: '資格試験',
    })),
  ]
    .filter((e) => e.date)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}
export function validateFields(obj         , fs         )                                {
  if (!obj || typeof obj !== 'object') return false
  const r = obj                           
  const allowed = new Set(fs.map(f => f.key))
  if (Object.keys(r).some(key => key !== 'id' && !allowed.has(key))) return false
  return (
    fs.every((f) => {
      const v = r[f.key]
      if (typeof v !== 'string' || v.length > 50000) return false
      if (!v)
        return (
          !['name', 'target'].includes(f.key) &&
          !f.options &&
          !['number', 'percent'].includes(f.type)
        )
      if (f.options) return f.options.includes(v)
      if (['number', 'percent'].includes(f.type))
        return /^\d+(\.\d+)?$/.test(v) && +v <= (f.type === 'percent' ? 100 : 1e12)
      if (f.type === 'date')
        return (
          /^(19\d{2}|20\d{2}|21\d{2})-\d{2}-\d{2}$/.test(v) &&
          Number.isFinite(dayNo(v)) &&
          iso(dayNo(v)) === v
        )
      if (f.type === 'time') return /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
      if (f.type === 'month') return /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
      if (f.type === 'url') {
        try {
          return ['http:', 'https:'].includes(new URL(v).protocol)
        } catch {
          return false
        }
      }
      return f.key !== 'name' || !!v.trim()
    }) && !(r.start && r.end && String(r.end) < String(r.start))
  )
}
export function valid(data         )                {
  if (!data || typeof data !== 'object') return false
  const s = data         
  if (
    !Object.keys(s).every((k) =>
      ['version', 'settings', 'money', 'rows', 'history'].includes(k)
    )
  )
    return false
  if (
    !s.rows ||
    typeof s.rows !== 'object' ||
    Object.keys(s.rows).some((k) => !kinds.includes(k        ))
  )
    return false
  return (
    s.version === 1 &&
    validateFields(s.settings, settingsFields) &&
    validateFields(s.money, moneyFields) &&
    +s.money.goal > 0 &&
    !!s.rows &&
    kinds.every(
      (k) =>
        Array.isArray(s.rows[k]) &&
        s.rows[k].length <= 10000 &&
        new Set(s.rows[k].map((r) => r?.id)).size === s.rows[k].length &&
        s.rows[k].every(
          (r) =>
            validateFields(r, schema[k]) &&
            typeof r.id === 'string' &&
            /^[\w-]{1,100}$/.test(r.id) &&
            (!(k === 'road') || !!(r.start && r.end)) &&
            (k !== 'events' || !!r.start)
        )
    ) &&
    Array.isArray(s.history) &&
    s.history.every(
      (h) =>
        h &&
        typeof h.day === 'string' &&
        Number.isFinite(dayNo(h.day)) &&
        iso(dayNo(h.day)) === h.day &&
        Number.isFinite(h.value) &&
        h.value >= 0
    )
  )
}
