import { fresh, kinds, valid,            } from './model.js'

// Each map key describes a unit that can be reconciled independently. Rows are
// atomic so a concurrent delete can never silently discard an edited record.
function entries(s       ) {
  const map = new Map                ()
  for (const group of ['settings', 'money']         )
    for (const [key, value] of Object.entries(s[group]))
      map.set(group + '/' + key, JSON.stringify(value))
  for (const k of kinds)
    for (const r of s.rows[k])
      map.set(k + '/' + r.id, JSON.stringify(r, Object.keys(r).sort()))
  for (const r of s.history)
    map.set('history/' + r.day, JSON.stringify(r.value))
  return map
}
                                       
export function reconcile(
  base       ,
  local       ,
  remote       ,
  choose         
) {
  const b = entries(base),
    l = entries(local),
    r = entries(remote),
    state = fresh(),
    conflicts           = []
  for (const k of kinds) state.rows[k] = []
  for (const path of new Set([...l.keys(), ...r.keys(), ...b.keys()])) {
    const old = b.get(path),
      mine = l.get(path),
      theirs = r.get(path)
    const conflict = mine !== theirs && mine !== old && theirs !== old
    if (conflict) conflicts.push(path)
    const picked = conflict
      ? choose === 'remote'
        ? theirs
        : mine
      : mine === old
      ? theirs
      : mine
    if (picked === undefined) continue
    const [group, key] = path.split('/'),
      value = JSON.parse(picked)
    if (group === 'settings' || group === 'money') state[group][key] = value
    else if (group === 'history') state.history.push({ day: key, value })
    else state.rows[group                          ].push(value)
  }
  state.history.sort((a, b) => a.day.localeCompare(b.day))
  if (!valid(state))
    throw Error(
      '統合したデータを検証できません。変更内容は端末に保持されています。'
    )
  return { state, conflicts }
}
export function equivalent(a       , b       ) {
  const left = entries(a),
    right = entries(b)
  return (
    left.size === right.size && [...left].every(([k, v]) => right.get(k) === v)
  )
}
