import { createClient } from '@/lib/supabase/server'
import Taskbar from '@/components/Taskbar'

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: profile }, { data: tanaman }] = await Promise.all([
        user
            ? supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        supabase.from('tanaman').select('*'),
    ])

    const displayName = profile?.full_name || user?.email || ''

    return (
        <div className="store-page">
            <Taskbar isLoggedIn={Boolean(user)} displayName={displayName} email={user?.email ?? ''} />
            <div style={{ padding: '2rem' }}>
                <h1>Daftar Tanaman</h1>
                <pre>{JSON.stringify(tanaman, null, 2)}</pre>
            </div>
        </div>
    )
}
