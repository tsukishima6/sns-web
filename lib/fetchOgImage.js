// news.google.com/rss/articles/... のリダイレクトページは、記事によらず
// 常にこの同一のGoogle Newsバッジ画像をog:imageとして返す(実記事URLは
// GoogleのバックエンドAPIをJS実行してしか解決できないため、記事固有の
// サムネイルはここからは取得できない)。記事ごとに違って見えて実は
// 全部同じ画像、という紛らわしい表示になるため除外する
const GOOGLE_NEWS_FALLBACK_IMAGE_MARKER =
  "lh3.googleusercontent.com/J6_coFbogxhRI9iM864NL_liGXvsQp2AupsKei7z0cNNfDvGUmWUy20nuUhkREQyrpY4bEeIBuc";

// ニュース(Google News RSS等)由来のFirestoreドキュメントはimgフィールドが
// 空のことが多い(bot側のfetchKaiwaiNewsGoogle.jsがOG画像を取得していないため)。
// リンク先のog:imageから動的に取得するための共通ヘルパー。
// /api/ogp/route.jsと同じ抽出方式。
export async function fetchOgImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; kaiwai-bot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) {
        if (m[1].includes(GOOGLE_NEWS_FALLBACK_IMAGE_MARKER)) return null;
        return m[1];
      }
    }
    return null;
  } catch (e) {
    console.error("fetchOgImage error:", url, e.message);
    return null;
  }
}
