import {
  access,
  api,
  ApiError,
  config,
  finishLogin,
  login,
  logout,
  session,
  authKey,
} from './auth.js'
import {
  localRevision,
  stored,
                  
                
} from './storage.js'
import { fresh, valid,            } from './model.js'
import { equivalent, reconcile,             } from './merge.js'
import { esc, download } from './format.js'

            
                
                      
        
                
                           
                        
                   
                  
                
 
                 
                  
                  
                 
              
               
 
const button = (id        , title        ) =>
  '<button data-action="cloud-' + id + '">' + title + '</button>'
export class Cloud {
          checkpoint             
          conflict           
          syncing = false
          consent = false
          timer = 0
          message = ''
  constructor(privateApp     ) {
    this.app = privateApp
  }
          app     
  get locked() {
    return !!this.checkpoint && this.checkpoint.owner !== session()?.uid
  }
          status(text        ) {
    this.message = text
    this.display()
  }
  display() {
    const signed = session()
    const info = this.message || (this.checkpoint ? '同期待ち' : '端末内に保存')
    const tag = document.querySelector('header .local')
    if (tag) tag.textContent = info
    const lockStatus = document.querySelector('#lock-status')
    if (lockStatus) lockStatus.textContent = info
    const panel = document.querySelector('#cloud-panel')
    if (!panel) return
    panel.innerHTML =
      '<h2>クラウド同期</h2><p role="status">' +
      esc(info) +
      '</p><div class="actions">' +
      (!signed
        ? button('login', 'Googleでログイン')
        : (!this.checkpoint
            ? button('start', 'この端末のデータを移行・同期')
            : button('sync', '今すぐ同期')) + button('logout', 'ログアウト')) +
      (this.checkpoint ? button('backup', '移行前のバックアップを保存') : '') +
      '</div>' +
      (this.conflict
        ? '<details open><summary>同じ項目に異なる変更があります</summary>' +
          this.conflict.paths
            .map((p) => {
              const value = (s       ) => {
                const [group, key] = p.split('/')
                if (group === 'settings' || group === 'money')
                  return s[group][key]
                if (group === 'history')
                  return s.history.find((x) => x.day === key)?.value
                return s.rows[group                       ]?.find(
                  (x) => x.id === key
                )
              }
              return (
                '<p>' +
                esc(p) +
                '</p><pre>端末 ' +
                esc(JSON.stringify(value(this.conflict .local)) ?? '削除') +
                '\nクラウド ' +
                esc(JSON.stringify(value(this.conflict .remote)) ?? '削除') +
                '</pre>'
              )
            })
            .join('') +
          button('local', '競合項目は端末側を採用') +
          button('remote', '競合項目はクラウド側を採用') +
          '</details>'
        : '') +
      (this.checkpoint ? button('recovery', '直近の競合の両案を保存') : '')
  }
  async init() {
    this.checkpoint = await stored            ('cloud')
    const u = new URL(location.href)
    if (
      u.searchParams.has('code') ||
      u.searchParams.has('error') ||
      new URLSearchParams(u.hash.slice(1)).has('error')
    ) {
      history.replaceState(null, '', u.pathname + '#settings')
      try {
        await finishLogin(u.href, this.checkpoint?.owner)
        this.message = 'Googleログイン済み'
      } catch {
        this.message =
          '認証を完了できませんでした。ログインを開始した画面から再試行してください。'
      }
    }
    window.addEventListener('storage', (e) => {
      if (e.key === authKey) {
        this.app.redraw()
        this.schedule()
      }
    })
    window.addEventListener('online', () => this.schedule())
    window.addEventListener('offline', () => {
      if (this.checkpoint) this.status('オフライン・端末に保存')
    })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.schedule()
    })
    if (typeof window.setInterval === 'function')
      window.setInterval(() => {
        if (!document.hidden) this.schedule()
      }, 60000)
    this.schedule()
  }
  schedule() {
    if (!this.checkpoint || this.locked) return
    clearTimeout(this.timer)
    this.timer = window.setTimeout(() => void this.run(), 750)
  }
  edited() {
    if (this.checkpoint) {
      this.conflict = undefined
      this.status(
        navigator.onLine ? '端末に保存・同期待ち' : 'オフライン・端末に保存'
      )
      this.schedule()
    }
  }
  async action(op        ) {
    try {
      if (op === 'login') {
        await login()
        return
      }
      if (op === 'logout') {
        if (
          !confirm(
            'この端末からログアウトしますか？ 編集内容は端末に保持されます。'
          )
        )
          return
        this.consent = false
        this.conflict = undefined
        await logout()
        this.message = 'ログアウトしました'
        this.app.redraw()
        return
      }
      if (this.locked) return
      if (op === 'backup' || op === 'recovery') {
        const b = await stored          (
          op === 'backup' ? 'migration-backup' : 'conflict-backup'
        )
        if (!b) {
          this.status('保存されたバックアップはありません')
          return
        }
        download(
          'career-' + op + '.json',
          JSON.stringify(op === 'backup' ? b.local : b, null, 2),
          'application/json'
        )
        return
      }
      if (op === 'start') {
        if (
          !confirm(
            '現在の端末データ（資金・メモ・自己分析を含む）を本人専用のSupabaseと統合します。移行前の端末データを保存して開始しますか？'
          )
        )
          return
        this.consent = true
      }
      const choice = op === 'local' || op === 'remote' ? op : undefined
      if (
        choice &&
        !confirm(
          '表示中の競合項目すべてにこの選択を適用しますか？ 両案は端末に保存します。'
        )
      )
        return
      await this.run(choice)
    } catch (e) {
      this.status(e instanceof Error ? e.message : '同期に失敗しました')
    }
  }
          async run(choice         ) {
    if (
      this.syncing ||
      this.locked ||
      (!this.checkpoint && !this.consent) ||
      !this.app.available()
    )
      return
    if (!navigator.onLine) {
      this.status('オフライン・端末に保存')
      return
    }
    this.syncing = true
    try {
      if (!navigator.locks)
        throw Error('同期にはWeb Locks対応ブラウザーが必要です。')
      await navigator.locks.request(
        'career-shift:sync:' + location.pathname,
        async () => {
          const s = await access(),
            cp = this.checkpoint,
            first = !cp,
            base = cp?.base ?? fresh()
          if (cp && (cp.owner !== s.uid || cp.project !== config().url))
            throw Error('この端末の所有者と一致しません。')
          const revision = localRevision(),
            mine = this.app.state(),
            prior = this.conflict
          const active = () =>
            session()?.uid === s.uid &&
            this.app.available() &&
            localRevision() === revision
          this.status('同期中')
          const found = await api(
            '/rest/v1/rpc/career_read',
            { known_rev: cp?.rev ?? -1 },
            s.access_token
          )
          if (
            !Number.isSafeInteger(found?.rev) ||
            found.rev < 0 ||
            (cp && found.rev < cp.rev)
          )
            throw Error(
              'クラウドの版を確認できません。端末データを保持しています。'
            )
          const remote =
            found.payload ??
            (found.rev === 0 ? fresh() : found.rev === cp?.rev ? base : null)
          if (!valid(remote))
            throw Error('クラウドのデータ形式を確認できません。')
          if (!active()) {
            this.status('端末の変更確定後に再同期')
            return
          }
          const decision =
            prior?.revision === revision && prior.cloudRev === found.rev
              ? choice
              : undefined
          const merged = reconcile(base, mine, remote, decision)
          if (merged.conflicts.length && !decision) {
            this.conflict = {
              revision,
              cloudRev: found.rev,
              paths: merged.conflicts,
              local: mine,
              remote,
            }
            this.status('要確認・設定で競合を解決')
            return
          }
          const next = {
            owner: s.uid,
            project: config().url,
            rev: found.rev,
            base: remote,
          }
          // Stage the merged local state, both originals and the observed cloud
          // revision in one transaction BEFORE any remote write.
          if (
            first ||
            found.rev !== cp.rev ||
            !equivalent(mine, merged.state) ||
            decision
          ) {
            await this.app.apply(
              merged.state,
              next,
              first || decision ? { local: mine, remote } : undefined,
              first
            )
            this.checkpoint = next
          }
          this.conflict = undefined
          if (found.rev === 0 || !equivalent(remote, merged.state)) {
            const staged = localRevision()
            if (session()?.uid !== s.uid || !this.app.available()) return
            const rev = await api(
              '/rest/v1/rpc/career_write',
              { expected_rev: found.rev, document: merged.state },
              s.access_token
            )
            if (rev !== found.rev + 1) throw Error('保存結果を再確認します。')
            if (
              localRevision() !== staged ||
              !this.app.available() ||
              session()?.uid !== s.uid
            ) {
              this.schedule()
              return
            }
            const done = { ...next, rev, base: merged.state }
            await this.app.apply(merged.state, done)
            this.checkpoint = done
          }
          this.status(
            '同期済み ' +
              new Date().toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })
          )
        }
      )
    } catch (e) {
      if (e instanceof ApiError && e.code === '40001') {
        this.status('他端末の更新を取得中')
        this.schedule()
      } else
        this.status(e instanceof Error ? e.message : '端末に保存・通信待ち')
    } finally {
      this.syncing = false
      if (this.locked) this.app.redraw()
    }
  }
}
