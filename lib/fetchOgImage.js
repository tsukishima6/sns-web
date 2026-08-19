// ニュース(Google News RSS等)由来のFirestoreドキュメントはimgフィールドが
// 空のことが多い(bot側のfetchKaiwaiNewsGoogle.jsがOG画像を取得していないため)。
// リンク先(news.google.comのリダイレクトページ自体にog:imageが埋め込まれている)
// から動的に取得するための共通ヘルパー。/api/ogp/route.jsと同じ抽出方式。
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
      if (m?.[1]) return m[1];
    }
    return null;
  } catch (e) {
    console.error("fetchOgImage error:", url, e.message);
    return null;
  }
}
