# biwakodonMap
マストドンのハッシュタグタイムライン最新40件（limit）を取得し、位置情報のGET引数の付いたマップページURLを抽出してGoogleマップ上にプロットする。

## 利用に必要な情報

* public/index.html

  GOOGLE_MAP_API_KEY Google Maps APIを利用するために必要なAPIKEY

* public/index.js

  MASTODON_API_URL　マストドンのハッシュタグトゥートリストを返すAPIエンドポイントのURL（Firebase等）

  MASTODON_URL　ハッシュタグTLを取得する対象のマストドンのURL

  MAP_URL　マップを公開しているURL

* functions/index.js※

  MASTODON_ACCESS_TOKEN　マストドンのAPIを利用するのに必要なアクセストークン

  MASTODON_API_URL　マストドンのAPIエンドポイントのURL

  ※functions下はFirebaseの利用を想定しており、MASTODON_API_URLで呼び出す。他のサービスで代替可能。MASTODON_ACCESS_TOKENの秘匿が目的。

## トゥートのプロットの仕方

以下の条件を満たしたトゥートがマッピングさる。

* ハッシュタグが含まれている（ハッシュタグTLに載る条件）
* 公開範囲が「公開」（ハッシュタグTLに載る条件）
* 位置情報等のGET引数が付いたマップのURLが含まれている（マッピングパラメータ）。
  * lat　緯度
  * lng　軽度
  * zoom　マップ拡大率
  * tag　ハッシュタグ
> 例
>
>     https://map.biwakodon.com?lat=34.97889374215057&lng=135.90158700942993&zoom=17&tag=biwakomap

### マッピングパラメータ生成方法

次の3つの生成方法がある。

* 手入力する
* 現在位置から取得する
* 地図上をタップした位置から取得する

#### 現在位置から取得する

1. マップにアクセスする
2. 左上メニューの「現在位置を取得」を選択する
3. 地図上に表示されるマッピングパラメータをコピーする

#### 地図上をタップした位置から取得する

1. 左上メニューの「タップした位置を取得[OFF]」を選択し、「タップ[ON]」に切り替わっていることを確認する
2. 地図上の任意の位置をタップする
3. 地図上に表示されるマッピングパラメータをコピーする
