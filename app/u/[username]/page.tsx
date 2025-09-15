// /app/u/[username]/page.tsx
import supabaseServer from '@/lib/supabase-server';

async function loadUser(username: string) {
  const supabase = supabaseServer(); // ← sin await

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle();

  if (!profile) return null;

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, artist, cover_url, external_url, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return { profile, posts: posts ?? [] };
}

export default async function UserPage({
  params,
}: {
  params: { username: string };
}) {
  const data = await loadUser(params.username);
  if (!data) return <div>Usuario no encontrado</div>;

  const { profile, posts } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div>
          <div className="font-semibold text-lg">
            {profile.display_name || profile.username}
          </div>
          <div className="text-sm text-neutral-500">@{profile.username}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {posts.map((p: any) => (
          <a
            key={p.id}
            href={p.external_url || '#'}
            target="_blank"
            className="block aspect-square rounded overflow-hidden bg-neutral-100"
          >
            {p.cover_url ? (
              <img
                src={p.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : null}
          </a>
        ))}
        {posts.length === 0 && (
          <div className="col-span-3 text-sm text-neutral-500">
            Sin publicaciones aún.
          </div>
        )}
      </div>
    </div>
  );
}
