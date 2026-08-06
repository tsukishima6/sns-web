# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このプロジェクトについて

kaiwai Web（https://kaiwai.vercel.app）。**ネイティブアプリ（FlutterFlow）を正として、Web版をそれに近づけていくプロジェクト**。Next.js (App Router) + Firebase、デプロイはVercel（`main`ブランチpushで自動デプロイ、Vercel CLI/`.vercel`は未導入）。

実装状況・ページ一覧・データ構造・ネイティブとの対応表は `README.md` にまとまっている。新しいページを移植する際は必ず参照すること。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド。**注意**: `postbuild`スクリプトが`next-sitemap-lite.config.js`を参照しているが、このファイルはリポジトリに存在しないためpostbuildのsitemap生成がエラーで終わる。ビルド本体（Next.jsのコンパイル）自体は成功するので無視してよい
- `npm run start` — 本番サーバー起動
- lintコマンド・テストコマンドは未整備（`eslint.config.mjs`はあるが`package.json`にscript登録なし）

## アーキテクチャ

- **`ffcode/lib/` がネイティブ（FlutterFlow）のソースで、仕様書として扱う**。Firestoreのフィールド名・画面の挙動・遷移フローは、Web側の実装だけでなく必ずこちらも確認すること。特にウィジェット（`*_widget.dart`）とレコードスキーマ（`ffcode/lib/backend/schema/*_record.dart`）が参考になる
  - ただし`ffcode/`はある時点のエクスポートで、Cloud Functionsの有無などクライアントコードだけでは判断できない情報もある。挙動に確信が持てない・複数画面で矛盾する記述がある場合は、FlutterFlow本体（https://app.flutterflow.io/project/tsukishima6-hoaplo 、claude-in-chrome MCPでアクセス可能）のView Code・Cloud Functionsタブや、本番Firestoreの実データ（Admin SDK）で裏付けを取ること。実例: `category`ドキュメントの`users`配列は`ffcode/`のUIコードからは書き込まれているように見えたが、FlutterFlow本体のCloud Functionsタブで登録数0を確認し、実際には書き込まれない死んだコードパスだと判明した（詳細はREADMEの2026-08-06ログ）
- Firestoreアクセスは`lib/firebase.js`のクライアントSDK（`db`/`auth`/`storage`）を使う。Server Component（例: `app/kaiwai/[kaiwaiID]/page.js`, `app/users/[userID]/profile/[profileID]/page.js`）もこのクライアントSDKをリクエスト時に直接呼び出しており、サーバー専用のデータ層は無い。これはこのコードベースの意図した作りなので「直す」対象ではない
- **本番のFirebaseプロジェクト（`tsukishima6-3d139`）はネイティブアプリと共有しており、ステージング環境が無い**。ブラウザでの動作確認（サインアップ・投稿・界隈作成など）はそのまま本番データを書き込む。確認用に作ったデータは終わったら削除すること
- `serviceAccountKey.json`（リポジトリ直下）と`firebase-admin`依存は、上記のような確認用データをAdmin SDK経由で後片付けする、といった一回限りのスクリプト用。アプリ本体からは使っていない
- パスエイリアス `@/*` はリポジトリ直下を指す（`jsconfig.json`の`paths`と`next.config.mjs`のwebpack aliasで設定）。`./app/*`や`./src/*`ではない
- `src/components/Header.js` は使われていない孤立した重複ファイル。実際に使われているヘッダーは `app/components/Header.js`

## データモデル（Firestore）で特に注意する点

- `users/{uid}`: `kaiwai`(現在アクティブな界隈ref・単数)、`kaiwai_list`(参加界隈の配列)、`nowprofile`(現在アクティブなプロフィールref)
- `users/{uid}/profile/{pid}`: ネイティブでは**ユーザーが参加/作成した界隈ごとに1つプロフィールドキュメントを持つ**設計（`name`/`ID`/`photo`/`bio` + `kaiwai`ref + `master`bool）。ただし`lib/AuthContext.js`のサインアップ処理は`users/{uid}/profile/{uid}`という単一のデフォルトプロフィールしか作らず`kaiwai`フィールドも設定しない。既存のWebページの多くはこの単一デフォルトプロフィール前提で書かれている
- **`FooterNav`（`app/components/FooterNav.js`）の「マイページ」リンクは`/users/{uid}/profile/{uid}`に固定されており、`nowprofile`は見ていない**。そのため複数プロフィール（界隈ごとのプロフィール切り替え）はまだ主要導線から辿れない（`app/profile/edit/page.js`は2026-08-06にこの種のバグ——保存後のリダイレクトが編集対象のプロフィールではなく常にデフォルトプロフィールに飛んでいた——を修正済みだが、`FooterNav`側は未修正のまま残っている）
- `kaiwai/{id}`: `app/kaiwai/page.js`の一覧クエリが`orderBy("number","desc")`を使っており、**`number`フィールドが無いドキュメントはこのクエリの結果に一切出てこない**（Firestoreの仕様）。ユーザーが自分で作成した界隈（`app/kaiwai/new/page.js`）は`number`を設定しないため、この一覧には出ない設計になっている（ネイティブの挙動を踏襲したもので、バグではない）。詳細ページへは直リンクで到達できる
- `kaiwai/{kaiwaiId}/category/{categoryId}`: ユーザーが自由に作る「タグ」（`category_name`, `amount`）。`profile.categories`/`users.categories`（refの配列）に紐付く。プロフィール編集(`app/profile/edit/page.js`)でタグの選択・新規作成ができ、タグ一覧は`app/kaiwai/[kaiwaiID]/category/[categoryID]/page.js`で見られる。投稿(`posts`)側の`categories`フィールドはネイティブ含めどこにも書き込み処理が無いので実装しないこと
- `collectionGroup`クエリ（例: `profile`コレクショングループへの`where("categories","array-contains",...)`）は単一フィールドでも明示的なインデックス登録が必要（自動インデックスはCOLLECTION_GROUPスコープをカバーしない）。`firestore.indexes.json`/`firebase.json`をリポジトリ直下に置いてあるので、新しいcollectionGroupクエリを追加したら`firebase deploy --only firestore:indexes --project tsukishima6-3d139`が必要（本番インフラ変更なのでユーザーに確認してから実行すること）。等号+array-containsの2フィールド複合クエリ（例: `where("kaiwai","==",x).where("favorited","array-contains",y)`）も同様に明示的な複合インデックスが要る
- **投稿へのコメント作成・削除がFirestoreセキュリティルール側で権限エラー（`Missing or insufficient permissions`）になり、Web版からは機能しない**（2026-08-07時点、未解決）。`app/components/CommentSection.js`のコード自体（送信・削除ロジック、フィールド構成）は`postcomments_record.dart`のスキーマと一致しており正しいが、ルール側がWebの書き込み形を許可していないと推測される。ネイティブでは同じ`postcomments`サブコレクションに実データが存在するため、ネイティブの書き込み経路とは異なる何らかのルール条件（認証方法・カスタムクレーム・書き込み元アプリの判定等）がありそう。原因調査にはFirebase ConsoleまたはFlutterFlow本体でのセキュリティルール確認が必要（このリポジトリに`firestore.rules`は無い）
- **認証まわりの競合状態に注意**: `lib/AuthContext.js`の`user`は初期値が`null`で、Firebase Authの状態確定（`onAuthStateChanged`）には遅延がある。ページ側で`if (user === null) router.push("/login")`のように`loading`を見ずに判定すると、ログイン済みでも初回レンダリング時に一瞬`user === null`のためログイン画面へ誤遷移することがある（`app/chat/page.js`・`app/notice/page.js`で発見し`loading`（`authLoading`）を先にチェックする形に修正済み。他のページも同じパターンがないか新規実装時は注意）
- ホーム画面はネイティブでは「kaiwai」タブ（`kaiwai==自分の界隈`のみ）と「all」タブ（`kaiwai==自分の界隈 OR all==true`、コミュニティ横断）の2つがある（`a_home_page_widget.dart`）。Web版の`/feed`（`app/feed/page.js`）は前者相当（`kaiwai_list`でのみ絞り込み）で、`all`フィールドは見ていない。`app/post/new/page.js`は2026-08-07以前は全投稿に`all: true`を書いていたが、これがネイティブの「all」タブに無条件で漏れる原因になっていたため削除済み。「all」タブ相当の機能自体はWeb未実装
- `app/explore/page.js`・`app/events/page.js`のように、**ログイン不要でコミュニティ横断に見せる「公開ディレクトリ」ページ（`/kaiwai`一覧と同じ性質）と、`userDoc.kaiwai`でスコープすべきページが混在している**。explore内でも「kaiwaiタブ」（界隈そのものを探す一覧、横断的でよい）と「userタブ」（ユーザー検索、界隈スコープが必要）で扱いが違う。新しいページ/クエリを足すときは、それが「公開ディレクトリ」なのか「自分の界隈内の機能」なのかを先に判断すること
