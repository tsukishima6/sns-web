// 賑わい演出用bot(いいねBot/投稿Bot/コメントBotが共用する4アカウント。
// firebase/functions-news-bots/generateBotPosts.js 等と同じUID)。
// AI生成の投稿を検索結果に出すとサイト全体の品質評価を下げるリスクがあるため、
// 内容の長さに関わらず常にnoindex対象にする。
export const BOT_POST_ACCOUNT_UIDS = [
  "2X8PY1QSjQS2pcKJqbw4PZh6wkD2",
  "uutpxS0DgYaq7iDlGnADQCm9zEn1",
  "YHJQmMdfY6bsFqu6axLTnVebQd02",
  "1fhvwJ8Zc8etXkrpPzese8xUa3o1",
];

// kaiwai参加時に自動生成される「〇〇KAIWAIに参加しました！」投稿の判定文字列
export const WELCOME_POST_MARKER = "に参加しました！よろしくお願いします。";

// この文字数未満は「薄いページ」とみなす(画像またはコメントがあれば例外)
export const MIN_INDEXABLE_TEXT_LENGTH = 40;

// 投稿をGoogle検索にインデックスさせてよいか判定する。
// sitemap生成時はcommentCountを省略してよい(全投稿分のコメント件数取得はコストが高いため)。
// その場合、コメントで厚みが出ている投稿はsitemapには載らないが、
// ページ自体のrobotsメタ(generateMetadata側でcommentCountありで再判定)では拾われる。
export function isPostIndexable({ post, authorUid, commentCount = 0 }) {
  if (!post) return false;
  if (authorUid && BOT_POST_ACCOUNT_UIDS.includes(authorUid)) return false;
  if (post.postDescription?.includes(WELCOME_POST_MARKER)) return false;

  const textLength = (post.postDescription || "").length + (post.postContent || "").length;
  if (textLength >= MIN_INDEXABLE_TEXT_LENGTH) return true;
  if (post.postPhoto) return true;
  if (commentCount > 0) return true;
  return false;
}
