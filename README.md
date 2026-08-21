# かなどっち？

年長〜小学1年生向けの、ひらがな表記を2択で学ぶWeb教材です。

- くっつきことば（は・を・へ）
- ちいさい「ゃゅょ」
- ちいさい「っ」
- のばすおと

各ステージは10問。進捗・★・30種類のバッジ・次回の復習問題を端末内に保存します。

## 公開サイト

https://tt-sensei.github.io/kanadocchi-/

## 構成

- `index.html`：3画面（トップ・プレイ・結果）
- `style.css`：教材固有のレイアウトと世界観
- `questions.js`：4ステージの問題データ
- `app.js`：共通出題エンジン、進捗、復習、音、バッジ

トップの「バッジずかん」では、獲得済み・未獲得の全30種類と次の獲得条件を確認できます。

## 共通基盤

[`edu-kit`](https://github.com/TT-sensei/edu-kit)を入口に、必要な資産だけを利用しています。

- `edu-components`：出題・採点・保存・進捗・バッジ
- `edu-effects`：基本UI・2択UI・正誤・学習向けモーション
- `sounds-recipe-`：正解・再挑戦・クリア・バッジ効果音
- `edu-assets`：国語・共通バッジ画像

HTML / CSS / Vanilla JavaScriptのみで動作し、npm・ビルド・APIキー・外部DBは不要です。
