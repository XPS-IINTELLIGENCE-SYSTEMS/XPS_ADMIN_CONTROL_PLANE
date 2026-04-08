import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function DeploymentStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checks = {}
    const run = async () => {
      // 1. Supabase env
      checks.supabase_config = !!(
        import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
      )

      // 2. API health
      try {
        const r = await fetch(`${API_URL}/api/health`)
        checks.api_health = r.ok
      } catch {
        checks.api_health = false
      }

      // 3. DOM loaded
      checks.ui_loaded = typeof window !== 'undefined'

      setStatus(checks)
      setLoading(false)
    }
    run()
  }, [])

  if (loading) return <p style={{ fontSize: 12, color: '#9ca3af' }}>🔄 Validating deployment…</p>

  const allOk = Object.values(status).every(Boolean)
  return (
    <div
      style={{
        fontSize: 12,
        background: allOk ? 'rgba(34,197,94,0.08)' : 'rgba(201,162,39,0.08)',
        border: `1px solid ${allOk ? 'rgba(34,197,94,0.3)' : 'rgba(201,162,39,0.3)'}`,
        borderRadius: 8,
        padding: '12px 16px',
        color: '#f0f0f0',
        maxWidth: 400,
      }}
    >
      <strong style={{ color: allOk ? '#22c55e' : '#c9a227' }}>
        {allOk ? '✅ All systems operational' : '⚠️ Deployment checks'}
      </strong>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.8 }}>
        {Object.entries(status).map(([k, v]) => (
          <li key={k} style={{ color: v ? '#22c55e' : '#ef4444' }}>
            {v ? '✓' : '✗'} {k.replace(/_/g, ' ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
