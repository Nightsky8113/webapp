# APIキー制限設定のトラブルシューティング

## 🔴 問題: Generative Language APIしか選択できない

APIキーの制限設定で「Generative Language API」しか表示されない場合の対処法です。

---

## 🎯 原因

この問題は、以下のいずれかが原因です：

1. **Cloud Vision APIが有効化されていない**
2. **間違ったプロジェクトが選択されている**
3. **APIキーを作成する前にCloud Vision APIを有効化していない**

---

## ✅ 解決方法

### 方法1: Cloud Vision APIを有効化する（推奨）

#### 手順1: 現在のプロジェクトを確認

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 画面上部のプロジェクト名を確認
3. APIキーを作成したプロジェクトと同じか確認

#### 手順2: Cloud Vision APIを有効化

1. 左側のメニューから「**APIとサービス**」→「**ライブラリ**」を開く
   - または直接: https://console.cloud.google.com/apis/library

2. 検索ボックスに「**Cloud Vision API**」と入力

3. 「**Cloud Vision API**」を選択

4. 「**有効にする**」または「**ENABLE**」をクリック

5. 有効化が完了するまで待つ（数秒かかります）

#### 手順3: APIキーの設定を再度開く

1. 左側のメニューから「**APIとサービス**」→「**認証情報**」を開く
   - または直接: https://console.cloud.google.com/apis/credentials

2. 作成したAPIキーをクリック

3. 「**APIの制限**」セクションで確認
   - これで「**Cloud Vision API**」も選択できるようになっているはずです

---

### 方法2: 新しいAPIキーを作成する

既存のAPIキーで問題が解決しない場合、新しいAPIキーを作成します。

#### 手順1: Cloud Vision APIが有効化されているか確認

1. [APIライブラリ](https://console.cloud.google.com/apis/library)にアクセス
2. 「Cloud Vision API」を検索
3. 有効化されているか確認
   - 「有効にする」ボタンが表示される場合 → まだ有効化されていません
   - 「APIの概要」が表示される場合 → 既に有効化されています

#### 手順2: Cloud Vision APIを有効化（まだの場合）

1. 「Cloud Vision API」を選択
2. 「有効にする」をクリック

#### 手順3: 新しいAPIキーを作成

1. [認証情報ページ](https://console.cloud.google.com/apis/credentials)にアクセス
2. 「認証情報を作成」→「APIキー」を選択
3. 新しいAPIキーが生成される
4. APIキーをコピーして保存

#### 手順4: 新しいAPIキーに制限を設定

1. 作成した新しいAPIキーをクリック
2. 「APIの制限」セクションで：
   - 「キーを制限する」を選択
   - 「Cloud Vision API」を選択
   - 「Generative Language API」も選択（Gemini API用）
3. 「保存」をクリック

---

### 方法3: 両方のAPIを有効化して使用する

Cloud Vision APIとGenerative Language APIの両方が必要な場合：

#### 必要なAPI

1. **Cloud Vision API** - OCR処理用
2. **Generative Language API** - Gemini API用（OCR結果の構造化）

#### 設定方法

1. 両方のAPIを有効化：
   - Cloud Vision API: https://console.cloud.google.com/apis/library/vision.googleapis.com
   - Generative Language API: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

2. APIキーの制限設定で両方を選択：
   - 「APIの制限」で「キーを制限する」を選択
   - 「Cloud Vision API」を選択
   - 「Generative Language API」も選択

3. 「保存」をクリック

---

## 🔍 確認手順

### 有効化されているAPIを確認する方法

1. [APIとサービスのダッシュボード](https://console.cloud.google.com/apis/dashboard)にアクセス
2. 「有効なAPI」セクションを確認
3. 以下のAPIが表示されているか確認：
   - ✅ Cloud Vision API
   - ✅ Generative Language API（Gemini API用）

---

## 💡 推奨設定

### 開発環境の場合

APIキーの制限を緩く設定（開発中の場合）：

1. 「APIの制限」で「キーを制限しない」を選択
   - 開発中はすべてのAPIを使用可能に
   - 本番環境では必ず制限を設定

### 本番環境の場合

APIキーの制限を厳しく設定：

1. 「APIの制限」で「キーを制限する」を選択
2. 使用するAPIのみを選択：
   - ✅ Cloud Vision API
   - ✅ Generative Language API（Gemini API用）
3. 「アプリケーションの制限」でHTTPリファラーを設定

---

## 🆘 それでも解決しない場合

### 確認項目

1. **正しいプロジェクトが選択されているか**
   - 画面上部のプロジェクト名を確認
   - APIキーを作成したプロジェクトと同じか確認

2. **APIが実際に有効化されているか**
   - [APIとサービスのダッシュボード](https://console.cloud.google.com/apis/dashboard)で確認

3. **ブラウザのキャッシュをクリア**
   - ブラウザのキャッシュやCookieをクリア
   - シークレットモードで再度試す

4. **少し時間をおく**
   - APIの有効化には数秒かかることがあります
   - 1-2分待ってから再度試す

### サポート

- [Google Cloud サポート](https://cloud.google.com/support)
- [Cloud Vision API ドキュメント](https://cloud.google.com/vision/docs)

---

## 📝 まとめ

1. **Cloud Vision APIを有効化する**（最も重要）
2. **正しいプロジェクトが選択されているか確認**
3. **新しいAPIキーを作成する**（必要に応じて）
4. **両方のAPI（Vision + Generative Language）を有効化する**

これで問題が解決するはずです！


