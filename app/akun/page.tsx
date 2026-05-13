import { redirect } from 'next/navigation'
import { updateProfile } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import Taskbar from '@/components/Taskbar'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/akun')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone_number, address')
    .eq('id', user.id)
    .maybeSingle()

  return {
    user,
    profile,
  }
}

export default async function AccountPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = firstParam(params?.status)
  const { user, profile } = await getProfile()
  const displayName = profile?.full_name || user.email || ''

  return (
    <main className="account-page">
      <Taskbar isLoggedIn displayName={displayName} email={user.email ?? ''} />

      <section className="admin-shell">
        <div className="admin-title">
          <div>
            <p>Profil Akun</p>
            <h1>Lengkapi data pribadi</h1>
          </div>
          <span>{user.email}</span>
        </div>

        {status === 'updated' && <div className="admin-alert success">Profil berhasil diperbarui.</div>}
        {status === 'invalid' && <div className="admin-alert">Lengkapi minimal satu data sebelum menyimpan.</div>}
        {status === 'failed' && <div className="admin-alert">Gagal memperbarui profil. Coba lagi.</div>}

        <form action={updateProfile} className="product-form">
          <label>
            Nama Lengkap
            <input name="full_name" placeholder="Nama lengkap" defaultValue={profile?.full_name ?? ''} />
          </label>
          <label>
            Email
            <input name="email" defaultValue={profile?.email ?? user.email ?? ''} readOnly />
          </label>
          <label>
            Nomor Telepon
            <input name="phone_number" placeholder="08xxxxxxxxxx" defaultValue={profile?.phone_number ?? ''} />
          </label>
          <label className="wide">
            Alamat Rumah
            <textarea name="address" rows={4} placeholder="Tuliskan alamat lengkap" defaultValue={profile?.address ?? ''} />
          </label>
          <button type="submit">Simpan Profil</button>
        </form>
      </section>
    </main>
  )
}
