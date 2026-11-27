import { fresh, valid, upgrade,            } from './model.js'
                                                                          
                                                    
export const localRevision=()=>revision
export async function stored   (key       )                     {
  return new Promise((resolve,reject)=>{const q=db.transaction('snapshots').objectStore('snapshots').get(key)
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})
}
let db             ,
  revision = 0
export const isNewWorkspace = () => revision === 0
export async function openState()                 {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('career-shift:' + new URL('.', location.href).pathname, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('snapshots')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      db = req.result
      const q = db.transaction('snapshots').objectStore('snapshots').get('current')
      q.onerror = () => reject(q.error)
      q.onsuccess = () => {
        if (!q.result) return resolve(fresh())
        const data=upgrade(q.result.data)
        if (!valid(data)) return reject(Error('保存データの形式を確認できません。'))
        revision = q.result.rev
        resolve(data)
      }
    }
  })
}
export async function saveState(data       , checkpoint            , recovery          , first=false) {
  if (!valid(data)) throw Error('入力内容またはバックアップ形式を確認してください。')
  const expected=revision
  return new Promise      ((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readwrite'),
      store = tx.objectStore('snapshots'),
      q = store.get('current')
    let conflict = false
    q.onsuccess = () => {
      if ((q.result?.rev ?? 0) !== expected) {
        conflict = true
        tx.abort()
        return
      }
      store.put({ rev: revision + 1, data }, 'current')
      if(checkpoint)store.put(checkpoint,'cloud')
      if(recovery)store.put(recovery,first?'migration-backup':'conflict-backup')
    }
    tx.oncomplete = () => {
      revision++
      resolve()
    }
    tx.onabort = () =>
      reject(
        Error(
          conflict
            ? '別のタブで更新されました。再読み込みしてください。'
            : '保存できません。端末の空き容量を確認してください。'
        )
      )
    tx.onerror = () => reject(tx.error)
  })
}
