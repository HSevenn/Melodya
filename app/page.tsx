import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';

/** ── CLIENT: si el mail abre con #access_token, reenvía a /auth/callback */
function AuthCodeRedirectClient() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (hash && hash.includes('access_token=')) {
    const p = new URLSearchParams(hash.slice(1));
    const access_token = p.get('access_token');
    const refresh_token = p.get('refresh_token');
    if (access_token && refresh_token) {
      const origin = window.location.origin;
      window.location.replace(
        `${origin}/auth/callback?access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`
      );
    }
  }
  return null;
}

async function fetchFeed() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('posts')
    .select(`
      id, title, artist, cover_url, external_url, note, created_at,
      profiles: user_id (id, username, display_name, avatar_url),
      reactions (kind)
    `)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

function countReactions(reactions: {kind: string}[] = [], kind: 'heart'|'fire') {
  return reactions.filter(r => r.kind === kind).length;
}

export default async function HomePage() {
  // 🔎 NUEVO: leemos la sesión o el user para confirmar auth
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const feed = await fetchFeed();

  return (
    <div className="space-y-6">
      {/* Debug visual de sesión */}
      <div className="text-sm text-neutral-600">
        {user ? (
          <span>Sesión iniciada como <b>{user.email}</b></span>
        ) : (
          <span>No has iniciado sesión</span>
        )}
      </div>

      <AuthCodeRedirectClient />

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Feed</h1>
        <Link href="/new" className="px-3 py-1.5 rounded bg-black text-white text-sm">Compartir</Link>
      </div>

      {feed.map((p: any) => (
        <article key={p.id} className="border rounded-xl p-4 flex gap-3">
          <div className="w-16 h-16 rounded overflow-hidden bg-neutral-100 shrink-0">
            {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover"/> : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-neutral-500">
              {p.profiles?.display_name || p.profiles?.username} compartió:
            </div>
            <div className="font-semibold truncate">{p.title}</div>
            <div className="text-sm text-neutral-600 truncate">{p.artist}</div>
            {p.note ? <p className="text-sm mt-1 text-neutral-700">{p.note}</p> : null}
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span>❤️ {countReactions(p.reactions, 'heart')}</span>
              <span>🔥 {countReactions(p.reactions, 'fire')}</span>
              {p.external_url ? (
                <a href={p.external_url} target="_blank" className="underline">Abrir</a>
              ) : null}
            </div>
          </div>
        </article>
      ))}

      {feed.length === 0 && (
        <div className="text-center text-sm text-neutral-500">
          Aún no hay publicaciones. ¡Sé el primero!
        </div>
      )}
    </div>
  );
}
