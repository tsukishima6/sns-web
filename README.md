# kaiwai Web

**ネイティブアプリ（FlutterFlow）を正として、Web版をそれに近づけていくプロジェクト。**

- ネイティブコード参照先: `ffcode/lib/`
- フレームワーク: Next.js (App Router) + Firebase
- デプロイ: Vercel

---

## 開発ルール

- `ffcode/` のDartコードを仕様書として参照し、機能・データ構造・UXを合わせる
- Firestoreのコレクション構造はネイティブと共通
- スタイルはTailwindベース。フォントは `Noto Sans JP` / `Urbanist`
- ブランドカラー: `#152635`（ダークネイビー）

---

## ページ一覧と実装状況

### Phase 1: 認証・基本導線 ✅ 完了

| ページ | パス | ファイル | 状態 |
|--------|------|---------|------|
| ログイン | `/login` | `app/login/page.js` | ✅ メール + Google |
| サインアップ | `/signup` | `app/signup/page.js` | ✅ メール + Google |
| フィード | `/feed` | `app/feed/page.js` | ✅ 界隈ベース投稿一覧 |
| 投稿作成 | `/post/new` | `app/post/new/page.js` | ✅ テキスト + 画像（最大3枚）|
| ヘッダー | - | `app/components/Header.js` | ✅ |
| フッターナビ | - | `app/components/FooterNav.js` | ✅ |
| 認証コンテキスト | - | `lib/AuthContext.js` | ✅ |

### Phase 2: プロフィール・コミュニティ

| ページ | パス | ファイル | 状態 |
|--------|------|---------|------|
| プロフィール | `/users/[uid]/profile/[pid]` | `app/users/[userID]/profile/[profileID]/page.js` | ✅ 自分のプロフィール時に編集ボタン表示 |
| プロフィール編集 | `/profile/edit` | `app/profile/edit/page.js` | ✅ name/ID/bio/photo編集 |
| 界隈一覧 | `/kaiwai` | `app/kaiwai/page.js` | ✅ カテゴリ別グリッド |
| 界隈詳細 | `/kaiwai/[id]` | `app/kaiwai/[kaiwaiID]/page.js` | ✅ 投稿・ニュース・SEO |
| 界隈作成 | `/kaiwai/new` | `app/kaiwai/new/page.js` | ✅ ネイティブのフル移植（専用プロフィール作成・開始投稿含む） |
| お知らせ | `/notice` | `app/notice/page.js` | ✅ |
| チャット一覧 | `/chat` | `app/chat/page.js` | ✅ |
| チャット詳細 | `/chat/[id]` | `app/chat/[chatID]/page.js` | ✅ リアルタイム・既読処理 |

### Phase 3: 探索・発見

| ページ | パス | ファイル | 状態 |
|--------|------|---------|------|
| ユーザー検索・界隈 | `/explore` | `app/explore/page.js` | ✅ ユーザー検索（前方一致）＋界隈タブ |
| タグ（旧称ハッシュタグ） | `/kaiwai/[kaiwaiID]/category/[categoryID]` | `app/kaiwai/[kaiwaiID]/category/[categoryID]/page.js` | ✅ ネイティブの「カテゴリ」機能を移植（詳細は進行ログ参照）。プロフィール編集(`/profile/edit`)でタグ選択・新規作成 |
| お気に入り | `/favorites` | `app/favorites/page.js` | ✅ お気に入り投稿一覧 |
| 設定 | `/settings` | `app/settings/page.js` | ✅ プロフィール表示・各メニュー・ログアウト |
| パスワード変更 | `/settings/password` | `app/settings/password/page.js` | ✅ リセットメール送信 |
| アカウント削除 | `/settings/delete` | `app/settings/delete/page.js` | ✅ 再認証→削除（メール/Google対応）|

### Phase 4: 拡張機能

| ページ | パス | ファイル | 状態 |
|--------|------|---------|------|
| イベント一覧 | `/events` | `app/events/page.js` | ✅ published==true、日程順 |
| イベント詳細 | `/events/[id]` | `app/events/[eventID]/page.js` | ✅ 日程・場所・料金・外部URL |
| イベント作成 | `/events/new` | 未作成 | ❌ 管理者機能のため保留 |
| ビジネス詳細 | `/business/[id]` | `app/business/[bizID]/page.js` | ✅ 情報・写真・SNSリンク |
| URL投稿（キュレート） | `/post/url` | `app/post/url/page.js` | ✅ OGP取得→界隈選択→news投稿 |
| OGP取得API | `/api/ogp` | `app/api/ogp/route.js` | ✅ サーバーサイドOGP取得 |
| ニュース詳細 | - | - | 外部URLを直接開く仕様のため不要 |

---

## データ構造メモ（Firestore）

```
users/{uid}
  ├── display_name, email, uid, photo_url
  ├── kaiwai_list: [ref]        // 参加界隈
  ├── nowprofile: ref           // 現在のプロフィールref
  ├── blocklist, blockedlist: [ref]
  └── profile/{pid}
        ├── name, ID, photo, bio
        └── created_time

users/{uid}/posts/{postID}
  ├── postDescription, postPhoto, postphoto2, postphoto3
  ├── postUser: ref, postUser_profile: ref
  ├── kaiwai: ref
  ├── timePosted, numlikes, amount_comment
  ├── users_liked: [ref], users_favorited: [ref]
  └── hashtags: []

users/{uid}/receipt/{id}       // お知らせ
  ├── follow, like, comment, post, event, checkin: bool
  ├── user_p: ref, postref: ref
  ├── time, seen, permission
  └── message: string

chats/{chatID}
  ├── group: bool, groupname: string
  ├── users_p: [ref], userp_a: ref, userp_b: ref
  ├── last_message, last_message_time
  └── last_message_seen_by: [ref]

kaiwai/{kaiwaiID}
  └── name, ...

```

---

## ネイティブとの対応表

| 機能 | FlutterFlow | Web |
|------|-------------|-----|
| ログイン | `pages/singn_in/` | `app/login/` |
| サインアップ | `pages/sign_up/` | `app/signup/` |
| ホーム/フィード | `pages/a_home_page/` | `app/feed/` |
| 投稿作成 | `post/post_create/` | `app/post/new/` |
| 投稿詳細 | `post/post_details/` | `app/posts/[uid]/[id]/` |
| プロフィール | `profiles/profile_ff/` | `app/users/[uid]/profile/[pid]/` |
| 界隈詳細 | `subkaiwai/kaiwai_items/` | `app/kaiwai/[id]/` |
| チャット一覧 | `chat/chat_2_main/` | `app/chat/` |
| チャット詳細 | `chat/chat_2_details/` | `app/chat/[id]/` |
| お知らせ | `pages/a_notice/` | `app/notice/` |
| 探索 | `pages/a_explore/` | 未実装 |

---

## 進行ログ

- `2026-06-28` Phase 1 完了確認・README作成。Phase 2に着手予定。
- `2026-06-28` Phase 2 要確認ファイルをレビュー。チャット詳細・界隈一覧/詳細はすべて完成を確認。プロフィール編集ページ（`/profile/edit`）を新規作成。プロフィールページに自分閲覧時の編集ボタンを追加。
- `2026-06-28` 設定ページ3点を実装（`/settings`・`/settings/password`・`/settings/delete`）。Headerにギアアイコンを追加。
- `2026-06-28` Phase 3 実装。`/explore`（ユーザー検索＋界隈タブ）・`/favorites`（お気に入り投稿）を新規作成。FooterNavの「探す」を`/explore`へ変更。プロフィールページにお気に入りリンクを追加。
- `2026-06-28` Phase 4 実装。`/events`・`/events/[id]`（イベント一覧・詳細）、`/business/[id]`（ビジネス詳細）、`/post/url`（URL投稿キュレート3ステップ）、`/api/ogp`（OGP取得API）を新規作成。
- `2026-08-06` `/kaiwai/new`（界隈作成）を実装。`ffcode/lib/subkaiwai/kaiwai_create/`をフル移植し、作成時にその界隈専用の新規プロフィール作成・`nowprofile`切り替え・開始投稿・親KAIWAI選択（`oya`フラグ）まで含める。作成後は`/kaiwai/[新規ID]`にリダイレクト。`/kaiwai`一覧ページに「＋ 界隈をつくる」導線を追加。
- `2026-08-06` 「ハッシュタグ」を調査した結果、投稿の`hashtags`文字列配列はネイティブのどこにも書き込み処理が無い未使用フィールドと判明。実体はプロフィール編集画面(`ffcode/lib/profiles/profile_edit/` + `ffcode/lib/components/category_select/`)から選択・作成する`kaiwai/{id}/category/{catId}`ドキュメント（`category_name`・`amount`）で、`profile.categories`配列に紐付く「タグ」機能だった。ネイティブの`A_Category`画面（`category.users`逆参照配列に依存）はそれを書き込む処理がクライアントにもCloud Functions（FlutterFlow本体で登録数0を確認）にも無く死んでいるコードと判断し移植対象から除外、`A_Hashtag`画面のユーザー一覧部分のみ（実データと整合）を移植した。`/profile/edit`にタグ選択・新規作成UIを追加（選択即座に対象カテゴリの`amount`を増減、保存でプロフィール/ユーザー両方に反映）、`/kaiwai/[kaiwaiID]/category/[categoryID]`（新規）でそのタグを持つユーザー一覧を表示、`/users/[userID]/profile/[profileID]`にタグチップを追加。`collectionGroup("profile").where("categories","array-contains",...)`のクエリ用に`firestore.indexes.json`を追加し本番にデプロイ済み。副次的に`/profile/edit`保存後のリダイレクトが常に`/users/{uid}/profile/{uid}`（デフォルトプロフィール）固定になっており`nowprofile`（界隈作成後に切り替わる編集対象）と食い違う既存バグを発見・修正した。
- `2026-08-06` 上記2機能について、FlutterFlow本体（View Code + プレビュー）でデザインも照らし合わせ、3点をネイティブに近づけて修正。(1) 親KAIWAI選択モーダルの一覧を、丸アバター+テキストの行から、ネイティブと同じ「画像を背景にしたグラデーションオーバーレイの横幅バー」に変更。(2) `/profile/edit`のタグ選択UIを、1つの折り返しグリッドから、ネイティブと同じ「🔥人気順」「🆕新着順」の横スクロール2段に変更（`category_select_widget.dart`準拠）。(3) `/kaiwai/[kaiwaiID]/category/[categoryID]`のユーザー一覧に、各ユーザーの他のタグ（最大2件）と自己紹介プレビューを追加（`a_hashtag_widget.dart`準拠）。
- `2026-08-07` これまで未追跡だった既存ページ群（chat/notice/explore/favorites/business/events/settings/post等）を3並列のExploreエージェントで`ffcode/`と照合し、15件の不整合を修正。詳細はCLAUDE.mdの「2026-08-07時点で判明している既知の問題」を参照。特に重大だったもの: ①`post/new`が全投稿に書いていた`all:true`を削除（ネイティブのホーム画面「all」タブに無条件で漏れていた）。②`/settings/delete`が実際にはFirebase Authユーザーを消すだけで投稿・プロフィール・コメント・チャット等を一切削除していなかったのを、ネイティブの「KAIWAIごとの退会」＋「全体削除」を合成した完全なクリーンアップに置き換え。③`explore`/`events`/`chat`一覧に界隈スコープのフィルタを追加。加えて`/favorites`のユーザー/イベント/ビジネスセクション、`/business/[bizID]`の営業時間・口コミ・関連イベント、`/notice`のフォロー申請承認/拒否、コメント削除、`/settings`のプライバシートグル5種、投稿の2・3枚目画像表示を追加。検証中に`chat`/`notice`ページの認証ガードに「`user`初期値`null`を未ログイン確定とみなして即リダイレクトする」既存の競合状態バグを発見しあわせて修正。新規クエリ用にFirestore複合インデックスを6件追加（`firestore.indexes.json`）。
- `2026-08-07` 上記で見つけた「コメント作成・削除が権限エラーになる」問題を調査・修正。Firebase Consoleの本番Firestoreセキュリティルールを確認したところ、`postcomments`への書き込みが許可されているのは`users/{parent}/postcomments/{document}`という**投稿者本人のusers直下のフラットなサブコレクション**のみで、`{path=**}/postcomments/{document}`（ネストしたパスも含む全体）はread専用だった。実データを確認すると、ネイティブは`users/{コメント投稿者uid}/postcomments/{id}`に`post`（対象投稿への参照）・`postuser`（投稿主への参照）フィールドを持たせて保存しており、投稿ごとの絞り込みはパスのネストではなくこの`post`フィールドへのクエリで行っている。`app/components/CommentSection.js`は`users/{投稿主uid}/posts/{postID}/postcomments`という誤ったネストパスに書き込んでいたため、ルールの読み取り専用マッチにしか一致せず権限エラーになっていた。書き込み先を`users/{自分のuid}/postcomments`に、一覧取得を`collectionGroup("postcomments").where("post","==",...)`に修正し、`app/settings/delete/page.js`の重複していた（無効だった）投稿配下コメント削除処理も整理。新たに`postcomments`の`post`+`timePosted`複合インデックスを追加・デプロイし、テストアカウントでコメント作成→表示→削除まで実際に動作することを確認済み。
- `2026-08-24` `/kaiwai/[kaiwaiID]`（界隈詳細）のSEOを強化。目的は「posts/newsが流動的で、ページ固有の評価が積み上がりにくい」という課題への対策と、テクニカルSEO・内部リンク・構造化データの穴埋め。①kaiwai固有の準静的コンテンツとして、`kaiwai/{id}/category`サブコレクションから人気タグ最大10件をチップ表示、`oya:true`の場合は子kaiwai一覧を「サブ界隈：」として、`parent`がある場合は兄弟kaiwai（同じ親を持つ他の子）を「関連する界隈」として内部リンク表示（親バッジも文字列からリンクに変更）。子/兄弟は`collection(db,"kaiwai")`への`where("parent","==",...)`という通常コレクションへの単純等号クエリなので追加の複合インデックスは不要。タグは`orderBy("amount")`をFirestoreクエリに持たせると`amount`未設定のドキュメントが結果から消える（`/explore`の`orderBy("number")`と同じ既知の罠）ため、全件取得してJS側でソート。②パンくずナビ（UI＋`BreadcrumbList`のJSON-LD）を追加。③`generateMetadata`とJSON-LDで別々に書かれていたdescription生成ロジックが食い違っていたのを`buildKaiwaiDescription()`に共通化し、JSON-LDに`dateModified`（`kaiwai.last_joined_at`由来）を追加。④`app/sitemap.js`の`lastModified`が全kaiwaiで常に`new Date()`になっており鮮度シグナルとして機能していなかったのを`last_joined_at`ベースに修正。⑤ニュース/投稿画像のalt属性を`""`/`"投稿画像"`固定から記事タイトル・投稿本文由来に、ニュース画像には元々`height:120px`にCSSでcropしていたのと一致する`width`/`height`属性を追加してCLS対策。⑥H1（`PageHeader.js`）のrubyふりがな注記を「kaiwai」から「kaiwaiSNS」に変更（ターゲットKW「〇〇SNS」への対応）。この変更でrt(注記)がbaseの「界隈」より幅広になり隙間が生まれる副作用が出たため、`rubyAlign:"start"`に変更して解消（詳細はCLAUDE.md参照）。bot投稿（`lib/postIndexing.js`の`BOT_POST_ACCOUNT_UIDS`）がこのページの投稿一覧からは除外されておらず、同一文面が日付だけ更新されて表示され続ける点は「賑わい演出のUIを優先」の判断で今回は対応見送り。
