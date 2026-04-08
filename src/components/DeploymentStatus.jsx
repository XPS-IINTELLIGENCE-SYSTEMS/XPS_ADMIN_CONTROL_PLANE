import { useEffect, useState } from 'react'

const API_URL = import.meta.env.API_URL || ''

export default function DeploymentStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checks = {}
    const run = async () => {
      // 1. Supabase env
      checks.supabase_config = !!(
        import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY
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

  if (loading) return <p style={{ fontSize: 12 }}>🔄 Validating deployment…</p>

  const allOk = Object.values(status).every(Boolean)
  return (
    <div
      style={{
        fontSize: 12,
        background: allOk ? '#e6f9ee' : '#fff3cd',
        border: `1px solid ${allOk ? '#4caf50' : '#ffc107'}`,
        borderRadius: 6,
        padding: '6px 10px',
      }}
    >
      <strong>{allOk ? '✅ All systems operational' : '⚠️ Deployment checks'}</strong>
      <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
        {Object.entries(status).map(([k, v]) => (
          <li key={k}>
            {v ? '✓' : '✗'} {k.replace(/_/g, ' ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
