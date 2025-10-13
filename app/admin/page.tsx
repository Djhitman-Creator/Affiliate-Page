'use client'
import { useState } from 'react'

export default function AdminPage() {
  const [source, setSource] = useState<'Karaoke Version'|'Party Tyme'>('Karaoke Version')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')

  async function uploadCsv() {
    if (!file) return
    const form = new FormData()
    form.append('source', source)
    form.append('file', file)
    setStatus('Uploading…')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    const j = await res.json()
    setStatus(`Imported ${j.count} rows`)
  }

  async function refreshPartyTyme() {
    setStatus('Refreshing Party Tyme from URL…')
    const res = await fetch('/api/admin/refresh/partytyme', { method: 'POST' })
    if (!res.ok) {
      setStatus('Failed: make sure PARTYTYME_CSV_URL is set in env')
      return
    }
    const j = await res.json()
    setStatus(`Auto-imported ${j.count} rows`)
  }

  return (
    <main className="card">
      <h2 className="text-lg font-semibold mb-3">Admin</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="glass rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Manual CSV Upload</h3>
          <label className="block mb-2 text-sm">Affiliate Source</label>
          <select className="input mb-3" value={source} onChange={e => setSource(e.target.value as any)}>
            <option>Karaoke Version</option>
            <option>Party Tyme</option>
          </select>
          <input type="file" className="input mb-3" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button className="btn" onClick={uploadCsv} disabled={!file}>Upload CSV</button>
        </section>

        <section className="glass rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Party Tyme Auto-Refresh</h3>
          <p className="text-sm text-white/70 mb-3">Fetches CSV from <code>PARTYTYME_CSV_URL</code> (set in environment). Great for weekly/monthly cron.</p>
          <button className="btn" onClick={refreshPartyTyme}>Run Now</button>
        </section>
      </div>
      <div className="mt-4 text-sm text-white/70">{status}</div>

      <section className="mt-8">
        <h3 className="font-semibold mb-2">YouTube Link Adapter</h3>
        <p className="text-sm text-white/70">Set <code>YOUTUBE_API_KEY</code> to show copyable karaoke links via YouTube Data API. Without a key, the UI falls back to a simple search link.</p>
      </section>
    </main>
  )
}
