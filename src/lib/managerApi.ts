type ApiError = { message: string; status?: number }
type Result<T> = { data: T | null; error: ApiError | null; hasMore?: boolean; nextOffset?: number }
type Session = { access_token: string; user: { id: string; email?: string } }
type ManagerImageAsset = { assetId: string; url: string; name: string; size: number; type: string; createdAt: string; width?: number; height?: number }
type AuthListener = (event: string, session: Session | null) => void
const listeners = new Set<AuthListener>()
const notify = (event: string, session: Session | null) => listeners.forEach((listener) => listener(event, session))
const sessionFrom = (value: any): Session | null => value?.user?.id ? { access_token: 'http-cookie-session', user: { id: value.user.id, email: value.user.email } } : null
const errorFrom = (value: any, status?: number): ApiError => ({ message: typeof value?.error === 'string' ? value.error : 'Заявката не беше изпълнена.', status })

class QueryBuilder implements PromiseLike<Result<any>> {
  private action: 'select' | 'insert' | 'update' = 'select'
  private columns = '*'
  private values: Record<string, unknown> | null = null
  private filters: Array<{ column: string; op: 'eq' | 'in'; value: unknown }> = []
  private ordering: { column: string; ascending: boolean } | null = null
  private rowLimit = 100
  private singleMode: 'single' | 'maybeSingle' | null = null
  private table: string
  constructor(table: string) { this.table = table }
  select(columns = '*') { this.columns = columns; return this }
  insert(values: Record<string, unknown> | Record<string, unknown>[]) { this.action = 'insert'; this.values = Array.isArray(values) ? values[0] || {} : values; return this }
  update(values: Record<string, unknown>) { this.action = 'update'; this.values = values; return this }
  eq(column: string, value: unknown) { this.filters.push({ column, op: 'eq', value }); return this }
  in(column: string, value: unknown[]) { this.filters.push({ column, op: 'in', value }); return this }
  order(column: string, options?: { ascending?: boolean }) { this.ordering = { column, ascending: options?.ascending !== false }; return this }
  limit(value: number) { this.rowLimit = Math.min(100, Math.max(1, value)); return this }
  single() { this.singleMode = 'single'; return this.execute() }
  maybeSingle() { this.singleMode = 'maybeSingle'; return this.execute() }
  private async execute(): Promise<Result<any>> {
    try {
      const response = await fetch('/api/manager/data', {
        method: this.action === 'select' ? 'POST' : this.action === 'insert' ? 'POST' : 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: this.table, action: this.action, select: this.columns, filters: this.filters, order: this.ordering, limit: this.rowLimit, values: this.values }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return { data: null, error: errorFrom(result, response.status) }
      let data = Array.isArray(result.data) ? result.data : null
      if (this.singleMode) {
        if (!data?.length && this.singleMode === 'single') return { data: null, error: { message: 'Expected one row, received none.' } }
        data = data?.[0] || null
      }
      return { data, error: null }
    } catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : 'Network error.' } } }
  }
  then<TResult1 = Result<any>, TResult2 = never>(onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export const managerApi = {
  auth: {
    async getSession() {
      try {
        const response = await fetch('/api/manager/auth/login', { credentials: 'same-origin', cache: 'no-store' })
        if (!response.ok) return { data: { session: null }, error: null }
        return { data: { session: sessionFrom(await response.json()) }, error: null }
      } catch { return { data: { session: null }, error: null } }
    },
    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback)
      return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
    },
    async signInWithPassword(credentials: { email: string; password: string }) {
      try {
        const response = await fetch('/api/manager/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) return { data: { session: null }, error: errorFrom(result, response.status) }
        const session = sessionFrom(result)
        notify('SIGNED_IN', session)
        return { data: { session, user: session?.user }, error: null }
      } catch (error) { return { data: { session: null }, error: { message: error instanceof Error ? error.message : 'Входът не беше успешен.' } } }
    },
    async signOut() {
      await fetch('/api/manager/auth/logout', { method: 'POST', credentials: 'same-origin' })
      notify('SIGNED_OUT', null)
      return { error: null }
    },
  },
  from(table: string) { return new QueryBuilder(table) },
  async rpc(name: string, args: Record<string, unknown>) {
    const endpoint = name === 'manager_site_analytics' ? '/api/manager/analytics?days=' + encodeURIComponent(String(args.p_days || 30)) : name === 'manager_request_catalog_changes' ? '/api/manager/request-changes' : ''
    if (!endpoint) return { data: null, error: { message: 'Unknown operation.' } }
    try {
      const response = await fetch(endpoint, { method: name === 'manager_site_analytics' ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...(name === 'manager_site_analytics' ? {} : { body: JSON.stringify(args) }) })
      const data = await response.json().catch(() => ({}))
      return response.ok ? { data, error: null } : { data: null, error: errorFrom(data, response.status) }
    } catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : 'Заявката не беше изпълнена.' } } }
  },
  images: {
        async upload(file: File) {
          try {
            const form = new FormData(); form.append('file', file, file.name)
            const response = await fetch('/api/manager/upload-image', { method: 'POST', credentials: 'same-origin', body: form })
            const data = await response.json().catch(() => ({}))
            return response.ok ? { data: { path: data.path, id: data.assetId, url: data.url }, error: null } : { data: null, error: errorFrom(data, response.status) }
          } catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : 'Качването не беше успешно.' } } }
        },
        async list(offset = 0): Promise<Result<ManagerImageAsset[]>> {
          try {
            const response = await fetch('/api/manager/image-library?offset=' + encodeURIComponent(String(offset)), { credentials: 'same-origin', cache: 'no-store' })
            const result = await response.json().catch(() => ({}))
            return response.ok
              ? {
                  data: Array.isArray(result.data) ? result.data as ManagerImageAsset[] : [],
                  error: null,
                  hasMore: result.hasMore === true,
                  nextOffset: Number.isInteger(result.nextOffset) ? result.nextOffset : offset,
                }
              : { data: null, error: errorFrom(result, response.status) }
          } catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : 'Не успяхме да заредим библиотеката със снимки.' } } }
        },
        async createUrls(paths: string[]): Promise<Result<Array<{ signedUrl: string }>>> { return { data: paths.map((path) => ({ signedUrl: /^https:\/\//i.test(path) ? path : '' })), error: null } },
  },
}
