# Tootmap
マストドンのハッシュタグタイムライン最新40件（limit）を取得し、位置情報のGET引数の付いたマップページURLを抽出してGoogleマップ上にプロットする。

[https://tootmap.net/howtouse.html](https://tootmap.net/howtouse.html)

## 利用に必要な情報

* public/index.html

  GOOGLE_MAP_API_KEY Google Maps APIを利用するために必要なAPIKEY

  MAP_DOMAIN　マップを公開しているサイトのドメイン

* public/index.js

  MAP_DOMAIN　マップを公開しているサイトのドメイン

  CLIENT_NAME　アプリ名（マストドン投稿クライアントとして表示されます）

  DEFAULT_TAG　ハッシュタグのデフォルト値

  API_URL　マストドンのハッシュタグトゥートリストを返すAPIエンドポイントのURL（Firebase等）

* functions/index.js※

  MASTODON_ACCESS_TOKEN　マストドンのAPIを利用するのに必要なアクセストークン

  MASTODON_API_URL　マストドンのAPIエンドポイントのURL

  ※functions下はFirebaseの利用を想定しており、MASTODON_API_URLで呼び出す。他のサービスで代替可能。MASTODON_ACCESS_TOKENの秘匿が目的。