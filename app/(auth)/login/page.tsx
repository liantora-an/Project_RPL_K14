'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const supabase = createClient()
  const nextPath = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('next') || '/'
    : '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage({ type: 'success', text: 'Berhasil masuk! Mengalihkan...' })
        window.location.href = nextPath
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: email.split('@')[0],
          })
        }
        setMessage({ type: 'success', text: 'Akun berhasil dibuat! Cek email Anda untuk verifikasi.' })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/auth-bg.jpg"
          alt="Botani Mart"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Dark green overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(20,45,18,0.72) 0%, rgba(20,45,18,0.55) 50%, rgba(20,45,18,0.68) 100%)',
          zIndex: 1
        }} />
      </div>

      {/* Tombol Kembali */}
      <Link href="/" style={{
        position: 'absolute', top: '1.5rem', left: '1.75rem',
        zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.3rem',
        color: 'rgba(255,255,255,0.88)', textDecoration: 'none', fontSize: '0.9rem',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Kembali
      </Link>

      {/* Main Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: '400px',
        padding: '6rem 1.25rem 2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.4rem',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 2px 12px rgba(0,0,0,0.4)'
          }}>
            Selamat datang di Botani Mart!
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.82)', fontSize: '0.875rem', margin: 0,
            fontFamily: 'system-ui, sans-serif', fontStyle: 'italic'
          }}>
            Lengkapi data untuk mulai berbelanja
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
          fontFamily: 'system-ui, sans-serif',
        }}>

          {/* Title */}
          <h2 style={{
            textAlign: 'center', fontSize: '1.3rem', fontWeight: 700,
            color: '#1e3d1a', margin: '0 0 1.5rem'
          }}>
            {isLogin ? 'Masuk' : 'Daftar'}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label htmlFor="auth-email" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="Masukkan email anda..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '0.6rem 0.85rem', fontSize: '0.875rem',
                  border: '1.5px solid #d1d5db', borderRadius: '8px',
                  background: '#fff', color: '#1f2937', outline: 'none',
                  width: '100%', boxSizing: 'border-box' as const,
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2d5a27'; e.target.style.boxShadow = '0 0 0 3px rgba(45,90,39,0.12)' }}
                onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label htmlFor="auth-password" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    padding: '0.6rem 2.6rem 0.6rem 0.85rem', fontSize: '0.875rem',
                    border: '1.5px solid #d1d5db', borderRadius: '8px',
                    background: '#fff', color: '#1f2937', outline: 'none',
                    width: '100%', boxSizing: 'border-box' as const,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2d5a27'; e.target.style.boxShadow = '0 0 0 3px rgba(45,90,39,0.12)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.65rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', display: 'flex', alignItems: 'center', padding: '0.2rem'
                  }}
                  aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '0.55rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center',
                background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: message.type === 'error' ? '#dc2626' : '#16a34a',
                border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
              }}>
                {message.text}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                fontSize: '0.95rem', fontWeight: 600, color: '#fff',
                background: loading ? '#5a8a54' : '#2d5a27',
                border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              {loading ? (
                <span style={{
                  width: '20px', height: '20px',
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite'
                }} />
              ) : 'Mulai'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0 1rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.76rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
              Atau {isLogin ? 'Masuk' : 'Daftar'} dengan
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Social */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {/* Phone */}
            <button type="button" style={{
              width: '46px', height: '46px', borderRadius: '50%',
              border: '1.5px solid #e5e7eb', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d5a27" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
            {/* Google (disabled) */}
            <button type="button" disabled style={{
              width: '46px', height: '46px', borderRadius: '50%',
              border: '1.5px solid #e5e7eb', background: '#fff',
              cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.45
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
          </div>

          {/* Toggle */}
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b7280', marginTop: '1rem', marginBottom: 0 }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setMessage(null) }}
              style={{
                background: 'none', border: 'none', color: '#2d5a27',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline'
              }}
            >
              {isLogin ? 'Daftar disini' : 'Masuk disini'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
