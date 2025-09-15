// /app/page.tsx (Home / Feed)
import Link from 'next/link';
import supabaseServer from '@/lib/supabase-server';

async function fetchFeed() {
  const supabase = supabaseServer(); // ← sin await

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

function countReactions(
  reactions: { kind: string }[] | null | undefined,
  kind: 'heart' | 'fire'
) {
  if (!Array.isArray(reactions)) return 0;
  return reactions.filter((r) => r.kind === kind).length;
}

export default async function HomePage() {
  const feed = await fetchFeed();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Feed</h1>
        <Link
          href="/new"
          className="px-3 py-1.5 rounded bg-black text-white text-sm"
        >
          Compartir
        </Link>
      </div>

      {feed.map((p: any) => {
        const authorName =
          p?.profiles?.display_name || p?.profiles?.username || 'Alguien';

        return (
          <article key={p.id} className="border rounded-xl p-4 flex gap-3">
            <div className="w-16 h-16 rounded overflow-hidden bg-neutral-100 shrink-0">
              {p.cover_url ? (
                <img
                  src={p.cover_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-neutral-500">
                {authorName} compartió:
              </div>

              <div className="font-semibold truncate">{p.title}</div>
              <div className="text-sm text-neutral-600 truncate">
                {p.artist}
              </div>

              {p.note ? (
                <p className="text-sm mt-1 text-neutral-700">{p.note}</p>
              ) : null}

              <div className="mt-2 flex items-center gap-3 text-sm">
                <span>❤️ {countReactions(p.reactions, 'heart')}</span>
                <span>🔥 {countReactions(p.reactions, 'fire')}</span>
                {p.external_url ? (
                  <a
                    href={p.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Abrir
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}

      {feed.length === 0 && (
        <div className="text-center text-sm text-neutral-500">
          Aún no hay publicaciones. ¡Sé el primero!
        </div>
      )}
    </div>
  );
}
