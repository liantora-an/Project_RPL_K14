import { createClient } from '@/lib/supabase/server'

export default async function Page() {
    const supabase = await createClient()

    // Contoh query ke tabel 'tanaman'
    const { data: tanaman } = await supabase.from('tanaman').select('*')

    return (
        <div>
            <h1>Daftar Tanaman</h1>
            <pre>{JSON.stringify(tanaman, null, 2)}</pre>
        </div>
    )
}
