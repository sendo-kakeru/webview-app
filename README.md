# webview-app

ネイティブアプリ内のWebviewで任意のURLを表示するシステム。

---

## 1. 事前準備（初回のみ）

### 共通

| ツール          | 推奨バージョン                | 備考                                                |
| --------------- | ----------------------------- | --------------------------------------------------- |
| Node.js         | 20 LTS 以上（動作確認は v24） | https://nodejs.org                                  |
| pnpm            | 最新                          |                                                     |
| Watchman（Mac） | 任意                          | `brew install watchman`（ファイル監視が安定します） |

### iOS を確認する場合（Mac 必須）

- **Xcode 26.4 以上**
  - ⚠️ SDK 57 は Xcode 26.4+（Swift 6.3）が必須です。これより古い Xcode ではiOS ビルドが必ず失敗します。
- 初回に一度だけ、コマンドライン設定を実行:
  ```bash
  sudo xcodebuild -license accept # Xcode のライセンス条項に同意
  xcode-select --install   # 必要なツールインストール
  ```
- iOS シミュレータは Xcode に同梱されています

### Android を確認する場合

- **Android Studio**（https://developer.android.com/studio）
- Android Studio の `Device Manager` から **エミュレータ（AVD）を 1 台作成**しておく。
- `adb` などにパスが通るよう、`~/.zshrc` に以下を追記:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
  ```

---

## 2. 初回ビルド（プラットフォームごとに一度だけ）

Dev Build をシミュレータ/エミュレータにインストールします。
**初回とネイティブ設定（`app.json` の変更・依存追加）を変えたときだけ**必要です。

### iOS

```bash
pnpm build:ios
```

### Android

エミュレータを Android Studio で起動しておき下記実行

```bash
pnpm build:android
```

---

## 3. 日常の動作確認

初回ビルド以降、js変更ならビルド不要です。
開発サーバーを起動して、インストール済みの Dev Build にホットリロードで反映されます。

```bash
pnpm dev
```

起動後、ターミナルで以下のキーを押します:

- `i` … iOS シミュレータで開く
- `a` … Android エミュレータで開く
- `r` … リロード

> ⚠️ `app.json`（ネイティブ設定）や依存パッケージを変更したときは、`pnpm dev` では反映されません。**3. の `pnpm build:ios` / `pnpm build:android` を再実行**してください。

---

## 4. 確認したい URL を差し替える

プレビューする URL は [src/app/index.tsx](src/app/index.tsx) の部分を差し替えてください。

```ts
const RESOLVED_URL = resolveUrl("https://example.com");
```

変更後、`pnpm dev` が起動中なら `r` でリロードすれば反映されます。

### ローカルwebサーバー（自分のPCで動かしている Web）を確認する場合

`http://localhost:3000` のようなローカル URL は、実機ではなく
シミュレータ/エミュレータから見ると「自分自身」を指してしまうため注意が必要です。

- **iOS シミュレータ**: Mac とネットワークを共有するので `http://localhost:3000` のままでOK。
  - ⚠️ **iOS（WebKit）は `0.0.0.0` を開けません。** `0.0.0.0/8` は仕様上「宛先アドレスとしては使用不可」と定められており（[RFC 6890](https://www.rfc-editor.org/rfc/rfc6890.html) のSpecial-Purpose Address Registry で `0.0.0.0/8` = "This host on this network"、**Destination = False**）、WebKit はこれに従い全ゼロ宛先への接続を遮断します。
- **Android エミュレータ**: エミュレータ内の `localhost` はエミュレータ自身を指します。
  - 本アプリの `resolveUrl()` が、Android のときだけ `localhost` / `127.0.0.1` を自動的に `10.0.2.2`（＝ホストPCを指す特別アドレス）へ書き換えます。そのまま`http://localhost:3000` と書けば動きます。
  - うまく繋がらない場合は、ポート転送を張ってから試してください:
    ```bash
    adb reverse tcp:3000 tcp:3000
    ```

---

## 5. 表示中のページを書き換える（DOM 操作）

WebView に読み込んだページの DOM は、JavaScript を注入して書き換えられます。
[src/app/index.tsx](src/app/index.tsx) の `INJECTED_JS` にコードを書くと、ページ読み込み後に WebView 内で実行されます（ページ遷移後も再注入されます）。

```ts
const INJECTED_JS = `
(function () {
  // 例: サイト側のヘッダーを隠す
  document.querySelector('header')?.style.setProperty('display', 'none');
  // 例: 背景色を変える
  document.body.style.backgroundColor = '#f00';
  // 例: 要素を差し込む
  const el = document.createElement('div');
  el.textContent = 'injected!';
  document.body.prepend(el);
})();
true;
`;
```

---

## 6. 画面の見方

- 指定した URL の Web ページが、WebView で**全画面**に表示されます。
- 画面上部に**赤いライン**が引かれ、iOS/Android それぞれのセーフエリア上端の位置と`safe top = <値>`（実測 px）が表示されます。不要なら[src/app/index.tsx](src/app/index.tsx) のオーバーレイ（`safeTopLine` の `View`）を消してください。
