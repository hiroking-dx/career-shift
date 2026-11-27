import {
  schema,
  settingsFields,
  moneyFields,
  kinds,
  cats,
  colors,
  statuses,
  stages,
  localDay,
  dayNo,
  iso,
  agenda,
  finance,
  progressOf,
  improvement,
            
           
             
             
} from './model.js'
import { esc as h, yen, markdown } from './format.js'
                                                                
export const pages                                 = {
  home: ['ダッシュボード', 'layout-dashboard'],
  road: ['ロードマップ', 'gantt-chart'],
  tasks: ['タスク', 'list-checks'],
  events: ['カレンダー', 'calendar-days'],
  companies: ['企業・選考', 'building-2'],
  wins: ['業務改善・実績', 'briefcase-business'],
  study: ['資格・学習', 'graduation-cap'],
  money: ['資金管理', 'wallet'],
  notes: ['メモ', 'notebook-pen'],
  analysis: ['自己分析', 'notebook-pen'],
  settings: ['設定・データ', 'settings'],
  more: ['その他', 'ellipsis'],
}
export const ui = {
  page: 'home'        ,
  mode: '',
  q: '',
  filter: '',
  order: '期限順',
  cursor: localDay(),
  compare: new Set        (),
}
export const icon = (key        ) =>
  '<svg class="icon" aria-hidden="true"><use href="./icons.svg#' + key + '"/></svg>'
export const btn = (a        , label        , ic = '', cls = '') =>
  '<button class="' +
  cls +
  '" data-action="' +
  h(a) +
  '">' +
  (ic ? icon(ic) : '') +
  h(label) +
  '</button>'
const nav = (p      , short         ) =>
  '<button data-nav="' +
  p +
  '" ' +
  (ui.page === p ? 'aria-current="page"' : '') +
  '>' +
  icon(pages[p][1]) +
  '<span>' +
  h(short || pages[p][0]) +
  '</span></button>'
const edit = (k      , r     ) => 'edit:' + k + ':' + r.id
const short = (s        ) => (s ? s.slice(5).replace('-', '/') : '期限なし')
const today = () => localDay()
const color = (r     ) => colors[Math.max(0, cats.indexOf(r.cat))]
const badge = (text        ) => '<span class="badge">' + h(text) + '</span>'
const pct = (n        ) =>
  '<div class="track"><i style="width:' + Math.min(100, Math.max(0, n)) + '%"></i></div>'
const empty = (t        ) => '<p class="empty">' + h(t) + '</p>'
const panel = (name        , content        , action = '') =>
  '<section class="card"><div class="sectionhead"><h2>' +
  name +
  '</h2>' +
  action +
  '</div>' +
  content +
  '</section>'
const stat = (name        , n                 , ic        , route      ) =>
  '<button class="stat" data-nav="' +
  route +
  '"><span>' +
  icon(ic) +
  h(name) +
  '</span><strong>' +
  h(n) +
  '</strong></button>'
export function shell(s       ) {
  const p = ui.page
  const navigation = (
    [
      'home',
      'road',
      'tasks',
      'events',
      'companies',
      'wins',
      'study',
      'money',
      'analysis','notes',
    ]          
  )
    .map((x) => nav(x))
    .join('')
  return (
    '<aside><div class="brand"><b class="logo">' +
    icon('route') +
    '</b>Career Shift<span>.</span></div><div class="navlabel">ワークスペース</div><nav>' +
    navigation +
    '</nav><div class="sidefoot">' +
    nav('settings') +
    '</div></aside><main><header><span>ワークスペース <i>/</i> <b>' +
    pages[p][0] +
    '</b></span><span class="local"><i></i> 端末内に保存</span></header><div class="content"><div class="heading"><div><div class="eyebrow">' +
    {
      home: 'OVERVIEW',
      road: 'ROADMAP',
      tasks: 'TASKS',
      events: 'CALENDAR',
      companies: 'COMPANIES',
      wins: 'ACHIEVEMENTS',
      study: 'LEARNING',
      money: 'FINANCE',
      notes: 'NOTES',
        analysis: 'SELF ANALYSIS',
      settings: 'SETTINGS',
      more: 'WORKSPACE',
    }[p] +
    '</div><h1>' +
    pages[p][0] +
    '</h1></div>' +
    (p === 'home'
      ? btn('new:tasks', 'タスクを追加', 'plus', 'primary')
      : kinds.includes(p        )
      ? btn('new:' + p, '追加', 'plus', 'primary')
      : '') +
    '</div>' +
    pageContent(s) +
    '</div></main><nav class="bottom">' +
    nav('home', 'ホーム') +
    nav('road', 'スケジュール') +
    nav('companies', '企業管理') +
    nav('money') +
    nav('more') +
    '</nav>'
  )
}
function dashboard(s       ) {
  const t = today(),
    d = dayNo(s.settings.target) - dayNo(t),
    tasks = s.rows.tasks,
    open = tasks.filter((x) => x.status !== '完了'),
    over = open.filter((x) => x.end && x.end < t),
    f = finance(s),
    c = s.rows.companies
  const upcoming = agenda(s)
      .filter((e) => e.date >= t)
      .slice(0, 4),
    next = [...open]
      .sort(
        (a, b) =>
          (a.end || '9999').localeCompare(b.end || '9999') ||
          ['高', '中', '低'].indexOf(a.priority) - ['高', '中', '低'].indexOf(b.priority)
      )
      .slice(0, 4)
  const current = s.rows.road
    .filter((x) => x.end >= t)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3)
  return (
    '<section class="hero"><div class="contours"></div><div class="heroInner"><div class="herolabel">' +
    icon('flag') +
    ' 転職予定日まで</div><div class="count">' +
    Math.max(0, d) +
    '<small>日</small></div><div class="target">' +
    h(s.settings.target.replaceAll('-', '.')) +
    ' <span>転職予定日</span></div></div><div class="heroprogress"><span>転職活動の進捗</span><strong>' +
    progressOf(s) +
    '<small>%</small></strong>' +
    pct(progressOf(s)) +
    '</div></section><div class="stats">' +
    stat('完了タスク', tasks.length - open.length, 'circle-check', 'tasks') +
    stat('未完了タスク', open.length, 'list-checks', 'tasks') +
    stat('期限超過', over.length, 'clock-3', 'tasks') +
    stat(
      '応募企業',
      c.filter((r) => r.applied || (stages.indexOf(r.status) >= 2 && r.status !== '辞退'))
        .length,
      'building-2',
      'companies'
    ) +
    '</div><div class="two">' +
    panel(
      '次に取り組むタスク',
      next
        .map((r) => btn(edit('tasks', r), r.name + '　' + short(r.end), 'square', 'listrow'))
        .join('') || empty('タスクを追加すると、期限の近い順に表示します。'),
      nav('tasks', '一覧')
    ) +
    panel('直近の予定', eventList(upcoming), nav('events', '一覧')) +
    panel(
      '転職ロードマップ',
      current
        .map(
          (r) =>
            '<button class="phaseitem" data-action="' +
            edit('road', r) +
            '"><i style="background:' +
            color(r) +
            '"></i><span>' +
            h(r.name) +
            '</span><small>' +
            short(r.start) +
            ' – ' +
            short(r.end) +
            '</small></button>'
        )
        .join('') || empty('予定されている工程はありません。'),
      nav('road', '全体')
    ) +
    panel(
      '新生活に向けた貯金',
      '<div class="big">' +
        yen(f.cash) +
        '</div>' +
        pct(f.rate) +
        '<div class="legend">目標 ' +
        yen(f.goal) +
        ' <b>' +
        f.rate +
        '%</b></div>',
      nav('money', '詳細')
    ) +
    '</div>' +
    panel(
      '選考状況',
      '<div class="legend">選考中 <b>' +
        c.filter((r) => stages.slice(2, 7).includes(r.status)).length +
        ' 社</b>内定獲得 <b>' +
        c.filter((r) => stages.slice(7, 9).includes(r.status)).length +
        ' 社</b></div>'
    )
  )
}
function eventList(events                           ) {
  return (
    events
      .map(
        (e) =>
          '<button class="phaseitem" data-action="' +
          edit(e.k, e.r) +
          '"><b class="datechip">' +
          short(e.date) +
          '</b><span>' +
          h(e.r.name) +
          '<small>' +
          h(e.type) +
          ' ' +
          h(e.time) +
          '</small></span></button>'
      )
      .join('') || empty('この期間の予定はありません。')
  )
}
const selectBox = (id        , list          , value        ) =>
  '<select id="' +
  id +
  '" aria-label="' +
  ({ filter: '絞り込み', order: '並べ替え' }[id] || id) +
  '">' +
  list
    .map((v) => '<option ' + (v === value ? 'selected' : '') + '>' + h(v) + '</option>')
    .join('') +
  '</select>'
function toolbar(modes          , filters           = [], search = false) {
  return (
    '<div class="toolbar"><div class="seg">' +
    modes
      .map((m, i) => btn('mode:' + m, m, '', (ui.mode || modes[0]) === m ? 'active' : ''))
      .join('') +
    '</div>' +
    (search
      ? '<input type="search" id="search" placeholder="検索…" aria-label="検索" value="' +
        h(ui.q) +
        '">'
      : '') +
    (filters.length ? selectBox('filter', ['すべて', ...filters], ui.filter || 'すべて') : '') +
    (ui.page === 'tasks'
      ? selectBox('order', ['期限順', '優先度順', '名前順'], ui.order)
      : '') +
    '</div>'
  )
}
function recordCard(k      , r     , s       ) {
  let meta = '',
    details = ''
  if (k === 'tasks') {
    meta = [r.cat, r.priority + '優先度', short(r.end)].join(' · ')
    details =
      pct(+r.progress) +
      '<small class="' +
      (r.status === '完了'
        ? 'complete'
        : r.end && r.end < today()
        ? 'overdue'
        : r.status === '保留'
        ? 'hold'
        : '') +
      '">' +
      h(r.progress) +
      '%　' +
      h(r.status) +
      (r.end && r.end < today() && r.status !== '完了' ? ' · 期限超過' : '') +
      '</small>' +
      r.subs
        .split('\n')
        .filter(Boolean)
        .map(
          (x, i) =>
            '<label class="sub"><input type="checkbox" data-sub="' +
            r.id +
            ':' +
            i +
            '" ' +
            (/^\[x\]/i.test(x) ? 'checked' : '') +
            '>' +
            h(x.replace(/^\[[ x]\]\s*/i, '')) +
            '</label>'
        )
        .join('')
  }
  if (k === 'companies') {
    meta = [r.role, r.place, r.interview ? '面接 ' + short(r.interview) : '']
      .filter(Boolean)
      .join(' · ')
    details = selectStatus(k, r, stages)
  }
  if (k === 'wins') {
    const v = improvement(r)
    meta = r.tech
    details =
      '<p>' +
      h(r.effect || r.issue || '実績を入力してください。') +
      '</p>' +
      badge('年間 ' + v.hours.toFixed(1) + ' 時間削減') +
      badge(v.percent + '% 削減') +
      badge(v.minutes + ' 分／回削減') +
      '<div>' +
      btn('txt:' + r.id, 'テキスト') +
      btn('md:' + r.id, 'Markdown') +
      '</div>'
  }
  if (k === 'study') {
    meta = r.status + ' · 試験 ' + short(r.exam)
    const rate = +r.goal ? Math.round((+r.actual / +r.goal) * 100) : 0
    details = pct(rate) + '<small>' + r.actual + ' / ' + r.goal + ' 時間　' + rate + '%</small>'
  }
  if(k==='analysis'){
    details=schema.analysis.slice(1).filter(f=>r[f.key]).map(f=>'<h4>'+h(f.label)+'</h4><p class="analysis-text">'+h(r[f.key])+'</p>').join('')
      +btn('share-analysis:'+r.id,'ChatGPT用テキストを保存','download')
  }
  if (k === 'notes') {
    meta = (r.pin === 'はい' ? '固定 · ' : '') + r.tags
    details =
      '<div class="md">' +
      markdown(r.body) +
      '</div>' +
      [
        s.rows.companies.find((x) => x.id === r.company)?.name,
        s.rows.tasks.find((x) => x.id === r.task)?.name,
      ]
        .filter(Boolean)
        .map((x) => badge(x ))
        .join('')
  }
  return (
    '<article class="record" ' +
    (['companies', 'tasks'].includes(k)
      ? 'draggable="true" data-drag="' + k + ':' + r.id + '"'
      : '') +
    '><button class="recordname" data-action="' +
    edit(k, r) +
    '">' +
    h(r.name) +
    icon('pencil') +
    '</button><small>' +
    h(meta) +
    '</small>' +
    details +
    '</article>'
  )
}
function selectStatus(k      , r     , opts          ) {
  return (
    '<select data-status="' +
    k +
    ':' +
    r.id +
    '" aria-label="選考状況">' +
    opts
      .map((v) => '<option ' + (r.status === v ? 'selected' : '') + '>' + h(v) + '</option>')
      .join('') +
    '</select>'
  )
}
function records(k      , s       ) {
  let r = s.rows[k].filter(
    (x) =>
      Object.values(x).join(' ').toLowerCase().includes(ui.q.toLowerCase()) &&
      (!ui.filter ||
        ui.filter === 'すべて' ||
        [x.status, x.cat, x.priority].includes(ui.filter))
  )
  if (k === 'notes') r.sort((a, b) => Number(b.pin === 'はい') - Number(a.pin === 'はい'))
  if (k === 'tasks')
    r.sort((a, b) =>
      ui.order === '名前順'
        ? a.name.localeCompare(b.name, 'ja')
        : ui.order === '優先度順'
        ? ['高', '中', '低'].indexOf(a.priority) - ['高', '中', '低'].indexOf(b.priority)
        : (a.end || '9999').localeCompare(b.end || '9999')
    )
  const modes =
    k === 'tasks' ? ['一覧', 'カンバン'] : k === 'companies' ? ['カンバン', '企業比較'] : []
  let content = ''
  if (k === 'companies' && ui.mode === '企業比較') {
    const selected = r.filter((x) => ui.compare.has(x.id))
    content =
      '<div class="card"><div class="checks">' +
      r
        .map(
          (x) =>
            '<label><input type="checkbox" data-compare="' +
            x.id +
            '" ' +
            (ui.compare.has(x.id) ? 'checked' : '') +
            '>' +
            h(x.name) +
            '</label>'
        )
        .join('') +
      '</div>' +
      (selected.length
        ? '<div class="scroll"><table><tr><th>比較項目</th>' +
          selected.map((x) => '<th>' + h(x.name) + '</th>').join('') +
          '</tr>' +
          schema.companies
            .slice(1)
            .map(
              (f) =>
                '<tr><th>' +
                f.label +
                '</th>' +
                selected.map((x) => '<td>' + h(x[f.key] || '—') + '</td>').join('') +
                '</tr>'
            )
            .join('') +
          '</table></div>'
        : empty('比較したい企業を選んでください。')) +
      '</div>'
  } else if ((ui.mode || modes[0]) === 'カンバン') {
    content =
      '<div class="board">' +
      (k === 'tasks' ? statuses : stages)
        .map(
          (v) =>
            '<section data-drop="' +
            h(v) +
            '"><h3>' +
            h(v) +
            ' <small>' +
            r.filter((x) => x.status === v).length +
            '</small></h3>' +
            r
              .filter((x) => x.status === v)
              .map((x) => recordCard(k, x, s))
              .join('') +
            '</section>'
        )
        .join('') +
      '</div>'
  } else
    content =
      '<div class="gridcards">' +
      r.map((x) => recordCard(k, x, s)).join('') +
      '</div>' +
      (!r.length ? empty('該当する項目はありません。右上の「追加」から登録できます。') : '')
  return (
    toolbar(modes, k === 'tasks' ? [...statuses, ...cats, '高', '中', '低'] : [], true) +
    content +
    (k === 'study' && r.length
      ? panel('学習時間（時間）', bars(r.map((x) => [x.name, +x.actual])))
      : '')
  )
}
function bars(values                    ) {
  const max = Math.max(1, ...values.map((v) => v[1]))
  return (
    '<div class="bars">' +
    values
      .map(
        ([label, n]) =>
          '<div><span>' +
          h(label) +
          '</span>' +
          pct((n / max) * 100) +
          '<b>' +
          n.toLocaleString('ja-JP') +
          '</b></div>'
      )
      .join('') +
    '</div>'
  )
}
function road(s       ) {
  const rows = [...s.rows.road].sort((a, b) => a.start.localeCompare(b.start)),
    weekly = ui.mode === '週',
    tn = dayNo(today()),
    min = Math.min(tn, ...rows.map((r) => dayNo(r.start))),
    max = Math.max(tn, ...rows.map((r) => dayNo(r.end)))
  let start = weekly
    ? min - ((new Date(min * 86400000).getUTCDay() + 6) % 7)
    : dayNo(iso(min).slice(0, 7) + '-01')
  const end = weekly
    ? max + 7
    : dayNo(localDay(new Date(+iso(max).slice(0, 4), +iso(max).slice(5, 7), 1)))
  const span = end - start
  const pos = (n        ) => ((n - start) / span) * 100
  let ticks = ''
  for (let i = start; i < end; ) {
    const label = iso(i)
    ticks +=
      '<span style="left:' +
      pos(i) +
      '%">' +
      (weekly ? short(label) : label.slice(2, 7).replace('-', '/')) +
      '</span>'
    i = weekly ? i + 7 : dayNo(localDay(new Date(+label.slice(0, 4), +label.slice(5, 7), 1)))
  }
  return (
    toolbar(['月', '週']) +
    '<div class="card ganttcard"><div class="scroll"><div class="gantt" style="min-width:' +
    Math.max(660, Math.min(20000, span * (weekly ? 6 : 2))) +
    'px"><div class="ghead">工程<div class="ticks">' +
    ticks +
    '</div></div>' +
    rows
      .map(
        (r) =>
          '<div class="grow"><button data-action="' +
          edit('road', r) +
          '">' +
            (r.milestone === 'はい' ? '<span aria-label="マイルストーン">◆</span>' : '') +
          h(r.name) +
          '</button><div class="lane" data-span="' +
          span +
          '"><i class="todayline" style="left:' +
          pos(tn + 0.5) +
          '%"></i><div class="bar" style="left:' +
          pos(dayNo(r.start)) +
          '%;width:' +
          Math.max(0.45, ((dayNo(r.end) - dayNo(r.start) + 1) / span) * 100) +
          '%;background:' +
          color(r) +
          '" data-bar="' +
          r.id +
          '" title="' +
          h(r.name + ' ' + r.start + ' ～ ' + r.end) +
          '"><i data-edge="start"></i><span>' +
          (r.milestone === 'はい' ? '◆ ' : '') +
          r.progress +
          '%</span><i data-edge="end"></i></div></div></div>'
      )
      .join('') +
    '</div></div><div class="legend">縦線は今日。工程名で編集、PCではバーの両端をドラッグして期間を変更できます。</div></div>' +
    panel(
      'カテゴリー',
      cats
        .map(
          (c, i) =>
            '<span class="key"><i style="background:' + colors[i] + '"></i>' + c + '</span>'
        )
        .join('')
    )
  )
}
function calendar(s       ) {
  const mode = ui.mode || '月間',
    d = new Date(ui.cursor + 'T12:00:00'),
    first = mode === '週間' ? ui.cursor : localDay(new Date(d.getFullYear(), d.getMonth(), 1)),
    start = dayNo(first) - ((new Date(first + 'T12:00:00').getDay() + 6) % 7),
    all = agenda(s)
  const dayEvents = (dt        ) => all.filter((e) => e.date === dt)
  return (
    toolbar(['月間', '週間', '一覧']) +
    '<section class="card"><div class="sectionhead"><h2>' +
    (mode === '一覧'
      ? 'すべての予定'
      : mode === '週間'
      ? short(iso(start)) + ' – ' + short(iso(start + 6))
      : d.getFullYear() + '年 ' + (d.getMonth() + 1) + '月') +
    '</h2><div>' +
    (mode !== '一覧' ? btn('prev', '前') + btn('today', '今日') + btn('next', '次') : '') +
    btn('ics', 'ICS出力', 'download') +
    '</div></div>' +
    (mode === '一覧'
      ? eventList(all)
      : '<div class="cal ' +
        (mode === '週間' ? 'week' : '') +
        '">' +
        '月火水木金土日'
          .split('')
          .map((x) => '<b>' + x + '</b>')
          .join('') +
        Array.from(
          {
            length:
              mode === '週間'
                ? 7
                : Math.ceil(
                    (dayNo(localDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))) -
                      start +
                      1) /
                      7
                  ) * 7,
          },
          (_, i) => {
            const dt = iso(start + i)
            return (
              '<div class="day ' +
              (dt === today() ? 'now' : '') +
              '"><button class="daynum" data-action="day:' +
              dt +
              '">' +
              Number(dt.slice(8)) +
              '</button>' +
              dayEvents(dt)
                .map(
                  (e) =>
                    '<button class="event" data-action="' +
                    edit(e.k, e.r) +
                    '">' +
                    h((e.time ? e.time + ' ' : '') + e.r.name) +
                    '</button>'
                )
                .join('') +
              '</div>'
            )
          }
        ).join('') +
        '</div>') +
    '</section>'
  )
}
function money(s       ) {
  const f = finance(s)
  const vals                     = [
    ['家具・家電', +s.money.goods],
    ['賃貸契約', +s.money.rent],
    ['引っ越し', +s.money.move],
  ]
  return (
    panel(
      '貯金目標',
      '<div class="big">' +
        yen(f.cash) +
        '</div>' +
        pct(f.rate) +
        '<div class="legend">目標 ' +
        yen(f.goal) +
        ' <b>' +
        f.rate +
        '%</b></div>',
      btn('money', '金額を編集', 'pencil')
    ) +
    '<div class="two">' +
    panel(
      '転職までの見通し',
      metrics([
        ['目標までの不足額', yen(f.gap)],
        ['必要な毎月の貯金', f.need === null ? '対象月なし' : yen(f.need)],
        ['転職予定日時点の予想貯金', yen(f.planned)],
        ['未確定の退職金・給付金', yen(f.uncertain)],
      ])
    ) +
    panel(
      '新生活の費用',
      metrics([
        ['本人負担率', s.money.share + '%'],
        ['初期費用の本人負担', yen(f.cost)],
        ['新生活開始後の残金', yen(f.remaining)],
        ['生活防衛資金確保後', yen(f.available)],
      ])
    ) +
    panel(
      '貯金推移（円）',
      s.history.length
        ? bars(s.history.map((x) => [x.day, x.value]))
        : empty('現在の貯金額を更新すると、その日の残高を記録します。')
    ) +
    panel('初期費用の内訳（円）', bars(vals)) +
    '</div><p class="hint">今月末から転職前月末までの ' +
    f.months +
    ' 回分を積み立てる計算です。予想貯金にはボーナス予定額を含みます。退職金・給付金の見込みは別枠で表示します。</p>'
  )
}
const metrics = (pairs            ) =>
  pairs
    .map(
      ([a, b]) =>
        '<div class="metric"><span>' + h(a) + '</span><strong>' + h(b) + '</strong></div>'
    )
    .join('')
function pageContent(s       ) {
  const p = ui.page
  if (p === 'home') return dashboard(s)
  if (p === 'road') return road(s)
  if (p === 'events') return calendar(s)
  if (p === 'money') return money(s)
  if (p === 'more')
    return (
      '<div class="card menu">' +
      (Object.keys(pages)          )
        .filter((x) => x !== 'more')
        .map((x) => nav(x))
        .join('') +
      '</div>'
    )
  if (p === 'settings')
    return (
      '<section class="card" id="cloud-panel"></section>'+
      panel(
        'プロフィールと目標',
        metrics([
          ...settingsFields.map((f) => [f.label, s.settings[f.key] || '未設定']),
          ['目標貯金額', yen(+s.money.goal)],
        ]),
        btn('settings', '編集', 'pencil')
      ) +
      panel(
        'データ管理',
        '<div class="actions">' +
          btn('backup', 'JSONバックアップ', 'download') +
          btn('restore', 'JSONから復元', 'upload') +
          btn('csv', 'CSV出力', 'download') +
          btn('reset', '全データを初期化', '', 'danger') +
          '</div><p class="hint">データはこの端末のブラウザーに保存されます。別の端末へ移す場合はJSONを使用してください。</p>' +
          '<div class="metric"><span>オフライン利用</span><strong>' +
          (navigator.serviceWorker?.controller ? '準備完了' : '未準備') +
          '</strong></div>'
      )
    )
  return records(p, s)
}
export function control(f       , v        , s       ) {
  const n = h(f.key),
    required =
      ['name', 'target'].includes(f.key) ||
      (ui.page === 'road' && ['start', 'end'].includes(f.key)) ||
      (ui.page === 'events' && f.key === 'start')
  let input = ''
  const opts =
    f.options ??
    (f.type === 'company' || f.type === 'task'
      ? ['', ...s.rows[f.type === 'company' ? 'companies' : 'tasks'].map((x) => x.id)]
      : null)
  if (opts)
    input =
      '<select name="' +
      n +
      '">' +
      opts
        .map(
          (o) =>
            '<option value="' +
            h(o) +
            '" ' +
            (o === v ? 'selected' : '') +
            '>' +
            h(
              f.type === 'company' || f.type === 'task'
                ? s.rows[f.type === 'company' ? 'companies' : 'tasks'].find((x) => x.id === o)
                    ?.name || '未指定'
                : o
            ) +
            '</option>'
        )
        .join('') +
      '</select>'
  else if (f.type === 'textarea')
    input = '<textarea name="' + n + '" rows="3" maxlength="50000">' + h(v) + '</textarea>'
  else
    input =
      '<input name="' +
      n +
      '" type="' +
      (f.type === 'percent' ? 'number' : f.type) +
      '" value="' +
      h(v) +
      '" ' +
      (required ? 'required ' : '') +
      (['percent', 'number'].includes(f.type)
        ? 'required min="0" step="any" max="' + (f.type === 'percent' ? 100 : 1e12) + '"'
        : 'maxlength="50000"') +
      '>'
  return (
    '<label class="field ' +
    (f.type === 'textarea' ? 'wide' : '') +
    '"><span>' +
    h(f.label) +
    '</span>' +
    input +
    '</label>'
  )
}
