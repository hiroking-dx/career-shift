import {
  schema,
  settingsFields,
  moneyFields,
  localDay,
  dayNo,
  iso,
  defaults,
  fresh,
  upgrade,
  valid,
  statuses,
  stages,
             
           
            
} from './model.js'
import { openState, saveState, isNewWorkspace } from './storage.js'
import { esc as h, calendarFile, download, csv, resume } from './format.js'
import { ui, shell, control, pages,           } from './view.js'
import { renderCharts, disposeCharts, renderDialog, disposeDialog } from './components.js'
import {Cloud} from './cloud.js'
import {analysisPrompt, analysisReply} from './exchange.js'
const root = document.querySelector             ('#app') ,
  dlg = document.querySelector                   ('dialog') ,
  notice = document.querySelector             ('#notice') 
let state       ,
  busy = false,
  timer = 0
const cloud=new Cloud({
  state:()=>state,available:()=>!busy&&!dlg.open,
  redraw:()=>{if(cloud.locked&&dlg.open)dlg.close();paint()},
  apply:async(data,cp,recovery,first)=>{
    if(busy||dlg.open)throw Error('編集の完了後に再同期します。')
    busy=true
    try{await saveState(data,cp,recovery,first);state=data;paint()}finally{busy=false}
  }
})
function tell(msg        ) {
  notice.textContent = msg
  notice.hidden = false
  clearTimeout(timer)
  timer = window.setTimeout(() => (notice.hidden = true), 5000)
}
function paint() {
  disposeCharts()
  if(cloud.locked){root.innerHTML='<section class="card"><h1>Career Shift.</h1><p>この端末のデータを開くには、利用登録したGoogleアカウントでログインしてください。</p><button data-action="cloud-login">Googleでログイン</button><p role="status" id="lock-status"></p></section>';cloud.display();return}
  document.documentElement.dataset.theme =
    state.settings.theme === 'ダーク'
      ? 'dark'
      : state.settings.theme === 'ライト'
      ? 'light'
      : 'auto'
  root.innerHTML = shell(state)
  renderCharts(root)
  cloud.display()
  document.title = pages[ui.page][0] + ' · Career Shift.'
}
function page(p      ) {
  ui.page = p
  ui.q = ''
  ui.filter = ''
  ui.mode = ''
  paint()
  window.scrollTo(0, 0)
}
async function commit(change                    , close = false) {
  if (busy||cloud.locked) return false
  busy = true
  try {
    const copy = structuredClone(state)
    change(copy)
    await saveState(copy)
    state = copy
    if (close && dlg.open) dlg.close()
    paint()
    cloud.edited()
    tell('保存しました')
    return true
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存に失敗しました'
    tell(msg)
    if (dlg.open) {
      const error = dlg.querySelector('[role=alert]')
      if (error) error.textContent = msg
    }
    return false
  } finally {
    busy = false
  }
}
                                       
const templates = [
  'ANDPAD導入・検証',
  'Excel VBAによる検査記録表の自動転記',
  'ケーブル布設表の業務改善',
  'RibbonXによる専用UIの作成',
  '社内標準化資料の整備',
  'PDF編集Webアプリの開発',
  'ボルト長計算Webアプリの開発',
]
let editing                                  = null
function editor(k      , id         , initial                         = {}) {
  editing = { k, id }
  const fs =
      k === 'settings'
        ? [...settingsFields, moneyFields[1]]
        : k === 'money'
        ? moneyFields
        : schema[k],
    row =
      k === 'settings'
        ? { ...state.settings, goal: state.money.goal }
        : k === 'money'
        ? state.money
        : state.rows[k].find((x) => x.id === id) ?? { ...defaults(fs), ...initial }
  const fields =
    (k === 'wins' && !id
      ? '<label class="field wide"><span>実績テンプレート</span><select id="template"><option value="">自由入力</option>' +
        templates.map((x) => '<option>' + h(x) + '</option>').join('') +
        '</select></label>'
      : '') + fs.map((f) => control(f, row[f.key] || '', state)).join('')
  renderDialog(
    dlg,
    pages[k][0] + (id || k === 'settings' || k === 'money' ? 'を編集' : 'を追加'),
    fields,
    !!id
  )
  dlg.showModal()
}
dlg.addEventListener('close', () => {
  editing = null
  disposeDialog()
})
dlg.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!editing) return
  const { k, id } = editing
  const form = e.target                   ,
    data = Object.fromEntries(new FormData(form))                          
  if (data.name) data.name = data.name.trim()
  if (data.start && data.end && data.end < data.start) {
    dlg.querySelector('[role=alert]') .textContent =
      '終了日・期限は開始日以降に設定してください。'
    return
  }
  if (data.goal !== undefined && ['settings', 'money'].includes(k) && +data.goal <= 0) {
    dlg.querySelector('[role=alert]') .textContent = '貯金目標額は1円以上で入力してください。'
    return
  }
  await commit((s) => {
    if (k === 'settings') {
      s.money.goal = data.goal
      delete data.goal
      s.settings = data
      return
    }
    if (k === 'money') {
      if (data.cash !== s.money.cash || !s.history.length) {
        const t = localDay()
        s.history = s.history.filter((x) => x.day !== t)
        s.history.push({ day: t, value: +data.cash })
        s.history.sort((a, b) => a.day.localeCompare(b.day))
      }
      s.money = data
      return
    }
    if (k === 'tasks') {
      if (data.status === '完了') data.progress = '100'
      else if (+data.progress === 100) {
        if (id && s.rows.tasks.find((x) => x.id === id)?.status === '完了') data.progress = '0'
        else data.status = '完了'
      }
    }
    const row = { ...data, id: id ?? crypto.randomUUID(), name: data.name }       
    if (id) s.rows[k] = s.rows[k].map((r) => (r.id === id ? row : r))
    else s.rows[k].push(row)
  }, true)
})
function status(k      , id        , v        ) {
  if (!(k === 'tasks' ? statuses : stages).includes(v)) return
  void commit((s) => {
    const r = s.rows[k].find((x) => x.id === id) 
    r.status = v
    if (k === 'tasks') {
      if (v === '完了') r.progress = '100'
      else if (+r.progress === 100) r.progress = '0'
    }
  })
}
function navigate(p      ) {
  if (location.hash.slice(1) === p) page(p)
  else location.hash = p
}
window.addEventListener('hashchange', () => {
  if (state) page(resolvePage())
})
function resolvePage() {
  const p = location.hash.slice(1)
  return Object.hasOwn(pages, p) ? (p        ) : 'home'
}
function action(a        ) {
  if(a.startsWith('cloud-')){void cloud.action(a.slice(6));return}
  if(cloud.locked)return
  if(a==='preview-analysis'){
    const input=document.querySelector                     ('#analysis-reply') 
    try{
      const draft=analysisReply(input.value)
      if(state.rows.analysis.some(r=>schema.analysis.every(f=>r[f.key]===draft[f.key])))
        throw Error('同じ自己分析が登録されています。')
      editor('analysis',undefined,draft)
    }catch(e){
      document.querySelector('#analysis-error') .textContent=e instanceof SyntaxError
        ? 'JSONを読み取れません。回答に含まれるJSON部分を貼り付けてください。'
        : (e         ).message
    }
    return
  }
  if(a.startsWith('share-analysis:')){
    const r=state.rows.analysis.find(x=>x.id===a.slice(15))
    download('自己分析-ChatGPT依頼文.txt',analysisPrompt(r),'text/plain;charset=utf-8')
    return
  }
  const [op, k, id] = a.split(':')
  if (op === 'new') return editor(k        )
  if (op === 'edit') return editor(k        , id)
  if (op === 'settings' || op === 'money') return editor(op)
  if (op === 'cancel') return dlg.close()
  if (op === 'delete' && editing?.id) {
    const { k, id } = editing
    if (k === 'money' || k === 'settings') return
    if (confirm('「' + state.rows[k].find((r) => r.id === id)?.name + '」を削除しますか？'))
      void commit((s) => {
        s.rows[k] = s.rows[k].filter((r) => r.id !== id)
        if (k === 'companies' || k === 'tasks')
          for (const r of s.rows.notes) {
            const key = k === 'tasks' ? 'task' : 'company'
            if (r[key] === id) r[key] = ''
          }
      }, true)
    return
  }
  if (op === 'mode') {
    ui.mode = k
    paint()
    return
  }
  if (op === 'day') return editor('events', undefined, { start: k })
  if (['prev', 'next', 'today'].includes(op)) {
    const d = new Date(ui.cursor + 'T12:00:00'),
      dir = op === 'next' ? 1 : -1
    ui.cursor =
      op === 'today'
        ? localDay()
        : ui.mode === '週間'
        ? iso(dayNo(ui.cursor) + dir * 7)
        : localDay(new Date(d.getFullYear(), d.getMonth() + dir, 1))
    paint()
    return
  }
  if (op === 'backup')
    return download(
      'career-shift-' + localDay() + '.json',
      JSON.stringify(state, null, 2),
      'application/json'
    )
  if (op === 'ics')
    return download('career-shift.ics', calendarFile(state), 'text/calendar;charset=utf-8')
  if (op === 'csv') return download('career-shift.csv', csv(state), 'text/csv;charset=utf-8')
  if (op === 'md' || op === 'txt') {
    const r = state.rows.wins.find((x) => x.id === k) 
    return download(
      '実績-' + r.name.replace(/[\\/:*?"<>|]/g, '_') + '.' + op,
      resume(r, op === 'md'),
      'text/plain;charset=utf-8'
    )
  }
  if (op === 'reset' && confirm('全データを初期化しますか？ 登録した内容は消去されます。'))
    void commit((s) => Object.assign(s, fresh()))
  if (op === 'restore') document.querySelector                  ('#restore') .click()
}
document.addEventListener('click', (e) => {
  const el = (e.target           ).closest             ('[data-nav],[data-action]')
  if (!el || busy) return
  if (el.dataset.nav) navigate(el.dataset.nav        )
  else if (el.dataset.action) action(el.dataset.action)
})
document.addEventListener('input', (e) => {
  const el = e.target                    
  if (el.id === 'search') {
    const pos = el.selectionStart
    ui.q = el.value
    paint()
    const next = document.querySelector                  ('#search') 
    next.focus()
    next.setSelectionRange(pos, pos)
  }
})
document.addEventListener('change', async (e) => {
  const el = e.target                    
  if (el.id === 'template') {
    if (el.value) (dlg.querySelector('[name=name]')                    ).value = el.value
    return
  }
  if (el.id === 'restore' && el.files?.[0]) {
    try {
      const file = el.files[0]
      if (file.size > 20e6) throw Error('20 MB以下のJSONを選択してください。')
      const value          = upgrade(JSON.parse(await file.text()))
      if (!valid(value))
        throw Error('対応するバージョン・形式のバックアップを選択してください。')
      if (confirm('現在のデータをこのバックアップの内容で置き換えますか？'))
        await commit((s) => Object.assign(s, value))
    } catch (e) {
      tell(e instanceof Error ? e.message : '読み込めませんでした')
    }
    el.value = ''
    return
  }
  if (el.id === 'filter' || el.id === 'order') {
    ui[el.id] = el.value
    paint()
  } else if (el.dataset.status) {
    const [k, id] = el.dataset.status.split(':')
    status(k        , id, el.value)
  } else if (el.dataset.compare) {
    if (el.checked) ui.compare.add(el.dataset.compare)
    else ui.compare.delete(el.dataset.compare)
    paint()
  } else if (el.dataset.sub) {
    const [id, i] = el.dataset.sub.split(':')
    await commit((s) => {
      const r = s.rows.tasks.find((x) => x.id === id) 
      const subs = r.subs.split('\n').filter(Boolean)
      subs[+i] = (el.checked ? '[x] ' : '') + subs[+i].replace(/^\[[x ]\]\s*/i, '')
      r.subs = subs.join('\n')
    })
  }
})
document.addEventListener('dragstart', (e) => {
  const d = (e.target               ).closest             ('[data-drag]')?.dataset.drag
  if (d) e.dataTransfer?.setData('text/plain', d)
})
document.addEventListener('dragover', (e) => {
  if ((e.target           ).closest('[data-drop]')) e.preventDefault()
})
document.addEventListener('drop', (e) => {
  const target = (e.target           ).closest             ('[data-drop]')
  if (!target) return
  e.preventDefault()
  const [k, id] = (e.dataTransfer?.getData('text/plain') || '').split(':')
  if ((k === 'tasks' || k === 'companies') && state.rows[k].some((x) => x.id === id))
    status(k, id, target.dataset.drop )
})
document.addEventListener('pointerdown', (e) => {
  const bar = (e.target           ).closest             ('[data-bar]')
  if (!bar || e.pointerType === 'touch') return
  const r = state.rows.road.find((x) => x.id === bar.dataset.bar) ,
    lane = bar.parentElement ,
    scale = Number(lane.dataset.span) / lane.clientWidth,
    edge = (e.target               ).dataset.edge,
    start = e.clientX
  bar.setPointerCapture(e.pointerId)
  bar.style.opacity = '.7'
  bar.onpointermove = (ev) => {
    bar.style.translate = ev.clientX - start + 'px 0'
  }
  bar.onpointercancel = () => paint()
  bar.onpointerup = (ev) => {
    bar.onpointermove = null
    const diff = Math.round((ev.clientX - start) * scale)
    if (!diff) {
      paint()
      editor('road', r.id)
      return
    }
    void commit((s) => {
      const v = s.rows.road.find((x) => x.id === r.id) 
      const a = dayNo(v.start),
        b = dayNo(v.end)
      v.start = iso(edge === 'end' ? a : Math.min(edge === 'start' ? b : Infinity, a + diff))
      v.end = iso(edge === 'start' ? b : Math.max(edge === 'end' ? a : -Infinity, b + diff))
    })
  }
})
async function boot() {
  try {
    const initial = new URLSearchParams(location.hash.slice(1)).get('initial')
    if (initial) history.replaceState(null, '', location.pathname + location.search)
    state = await openState()
    await cloud.init()
    if (initial && isNewWorkspace()) {
      const profile          = JSON.parse(initial)
      if (profile && typeof profile === 'object') {
        const draft = structuredClone(state)
        for (const f of settingsFields) {
          const value = (profile                           )[f.key]
          if (typeof value === 'string') draft.settings[f.key] = value
        }
        await saveState(draft)
        state = draft
      }
    }
    ui.page = resolvePage()
    paint()
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      try {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (ui.page === 'settings') paint()
        })
        await navigator.serviceWorker.register('./sw.js')
      } catch {
        tell('オフライン準備ができませんでした。オンラインで再度開いてください。')
      }
    }
  } catch (e) {
    root.textContent =
      'データを開けませんでした。 ' +
      (e instanceof Error ? e.message : 'ブラウザーの保存設定を確認してください。')
  }
}
void boot()
