                          
                      
                  
                  
                                          
                          
                  
 
                                                                     
                         
                                          
                                     
 
                                               
const el = React.createElement
let dialogRoot              = null
const charts         = []
function Editor(props                                                       ) {
  return el(
    'form',
    null,
    el(
      'div',
      { className: 'sectionhead' },
      el('h2', null, props.title),
      el('button', { type: 'button', 'data-action': 'cancel', 'aria-label': '閉じる' }, '×')
    ),
    el('div', { className: 'fields', dangerouslySetInnerHTML: { __html: props.fields } }),
    el('p', { role: 'alert' }),
    el(
      'footer',
      null,
      props.canDelete
        ? el('button', { type: 'button', 'data-action': 'delete', className: 'danger' }, '削除')
        : null,
      el('span', { className: 'spacer' }),
      el('button', { type: 'button', 'data-action': 'cancel' }, 'キャンセル'),
      el('button', { type: 'submit', className: 'primary' }, '保存')
    )
  )
}
export function renderDialog(
  container         ,
  title        ,
  fields        ,
  canDelete         
) {
  dialogRoot = ReactDOM.createRoot(container)
  ReactDOM.flushSync(() => dialogRoot .render(el(Editor, { title, fields, canDelete })))
}
export function disposeDialog() {
  dialogRoot?.unmount()
  dialogRoot = null
}
export function disposeCharts() {
  for (const c of charts) c.unmount()
  charts.length = 0
}
export function renderCharts(container         ) {
  for (const box of container.querySelectorAll             ('.bars')) {
    const data = Array.from(box.children, (r) => ({
      name: r.firstElementChild?.textContent ?? '',
      value: Number(r.lastElementChild?.textContent?.replace(/,/g, '')),
    }))
    const parent = box.parentElement 
    const mount = document.createElement('div')
    mount.className = 'chart'
    mount.style.height = Math.max(110, Math.min(300, 42 * data.length)) + 'px'
    parent.insertBefore(mount, box)
    const root = ReactDOM.createRoot(mount)
    charts.push(root)
    const trend = parent.textContent?.includes('貯金推移')
    const plot = trend
      ? el(
          Recharts.LineChart,
          { data },
          el(Recharts.XAxis, { dataKey: 'name', tick: { fontSize: 10 } }),
          el(Recharts.YAxis, { width: 62, tick: { fontSize: 10 } }),
          el(Recharts.Tooltip, null),
          el(Recharts.Line, {
            name: '貯金額',
            dataKey: 'value',
            stroke: '#207c70',
            strokeWidth: 3,
            isAnimationActive: false,
          })
        )
      : el(
          Recharts.BarChart,
          { data, layout: 'vertical' },
          el(Recharts.XAxis, { type: 'number', tick: { fontSize: 10 } }),
          el(Recharts.YAxis, {
            type: 'category',
            dataKey: 'name',
            width: 90,
            tick: { fontSize: 11 },
          }),
          el(Recharts.Tooltip, null),
          el(Recharts.Bar, {
            name: '金額・時間',
            dataKey: 'value',
            fill: '#31897c',
            radius: [0, 4, 4, 0],
            isAnimationActive: false,
          })
        )
    root.render(el(Recharts.ResponsiveContainer, { width: '100%', height: '100%' }, plot))
  }
}
