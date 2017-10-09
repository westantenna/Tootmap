# biwakodonMap
マストドンのハッシュタグトゥートをGoogleMap上に表示させる

## 利用に必要な情報

* public/index.html

  GOOGLE_MAP_API_KEY Google Maps APIを利用するために必要なAPIKEY

* public/index.js

  MASTODON_API_URL　マストドンのハッシュタグトゥートリストを返すAPIエンドポイントのURL

  MASTODON_URL　マストドンのURL

  MAP_URL　Google MapsのURL

* functions/index.js※

  MASTODON_ACCESS_TOKEN　マストドンのAPIを利用するのに必要なアクセストークン

  MASTODON_API_URL　マストドンのAPIエンドポイントのURL

  ※functions下はFirebaseの利用を想定しており、MASTODON_API_URLで呼び出す。他のサービスで代替可能。