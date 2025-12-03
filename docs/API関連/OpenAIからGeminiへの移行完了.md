# OpenAI APIからGoogle Gemini APIへの移行完了

OpenAI APIの無料枠が終了したため、Google Gemini APIに切り替えました。

## ✅ 変更内容

### 1. 新しいサービス作成

- ✅ **`src/services/geminiService.js`** を作成
  - Google Gemini APIを使用してOCR結果を構造化
  - Gemini 1.5 Flashモデルを使用（無料枠で利用可能、高速）

### 2. 既存コードの更新

- ✅ **`src/services/ocrService.js`** を更新
  - `openAIService.js`から`geminiService.js`に変更

### 3. 環境変数の更新

- ✅ **`ENV_EXAMPLE.txt`** を更新
  - `VITE_OPENAI_API_KEY` → `VITE_GOOGLE_GEMINI_API_KEY`に変更

### 4. CSPヘッダーの更新

- ✅ **`vercel.json`** を更新
  - Gemini APIのドメイン（`https://generativelanguage.googleapis.com`）を追加

### 5. ドキュメントの作成

- ✅ **`docs/API関連/AIのAPI代替案調査.md`** - 代替案の調査結果
- ✅ **`docs/API関連/Gemini API設定ガイド.md`** - Gemini APIの設定手順

---

## 📊 変更前後の比較

| 項目 | OpenAI API | Google Gemini API |
|------|-----------|-------------------|
| **無料枠** | 終了済み | ほぼ無制限（個人開発・テスト目的） |
| **料金** | 有料 | 無料枠内で使用可能 |
| **モデル** | GPT-3.5 Turbo | Gemini 1.5 Flash |
| **日本語対応** | ✅ | ✅ |
| **構造化データ** | ✅ | ✅ |

---

## 🚀 次のステップ

### 1. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでログイン
3. 「Get API key」を選択
4. APIキーを作成
5. APIキーをコピー

詳細は `docs/API関連/Gemini API設定ガイド.md` を参照してください。

### 2. 環境変数の設定

`.env`ファイルに追加：

```env
VITE_GOOGLE_GEMINI_API_KEY=your-api-key-here
```

### 3. 本番環境での設定（Vercel）

1. Vercel Dashboardにログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. `VITE_GOOGLE_GEMINI_API_KEY`を追加
5. 再デプロイ

---

## 💰 コスト見積もり（更新）

### コンテスト用途（3か月間）

| API | 使用量 | 無料枠 | 超過分 | 合計 |
|-----|--------|--------|--------|------|
| **Google Cloud Vision API** | 120回 | $300クレジット内 | - | **$0** |
| **Google Gemini API** | 120回 | ほぼ無制限 | - | **$0** |
| **合計** | - | - | - | **$0** ✅ |

**結論**: コンテスト用途であれば、**完全無料で運用可能**です。

---

## 🔍 主な変更点

### APIエンドポイント

**変更前（OpenAI）**:
```
https://api.openai.com/v1/chat/completions
```

**変更後（Gemini）**:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

### リクエスト形式

**変更前（OpenAI）**:
```javascript
{
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: '...' },
    { role: 'user', content: '...' }
  ]
}
```

**変更後（Gemini）**:
```javascript
{
  contents: [
    {
      parts: [
        { text: '...' }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 2000,
    responseMimeType: 'application/json'
  }
}
```

---

## ✅ 互換性

既存のOCR処理フローは変更なしで、APIの切り替えのみです。

1. Google Cloud Vision APIでOCR処理
2. Google Gemini APIで構造化処理
3. データベースに商品情報を保存

すべての処理が正常に動作します。

---

## 📝 関連ファイル

- `src/services/geminiService.js` - Gemini API統合サービス（新規）
- `src/services/ocrService.js` - OCR処理統合サービス（更新）
- `src/services/openAIService.js` - OpenAI APIサービス（使用停止、削除可能）
- `ENV_EXAMPLE.txt` - 環境変数サンプル（更新）
- `vercel.json` - Vercel設定（CSPヘッダー更新）
- `docs/API関連/AIのAPI代替案調査.md` - 代替案調査結果（新規）
- `docs/API関連/Gemini API設定ガイド.md` - 設定ガイド（新規）

---

## 🔄 今後の対応

### オプション: OpenAI APIサービスの削除

`src/services/openAIService.js`は使用されていないため、削除可能です。ただし、将来の互換性のために残しておくことも可能です。

### オプション: Anthropic Claude APIへの対応

将来的にAnthropic Claude APIにも対応する場合は、サービスを抽象化して切り替え可能にすることも検討できます。

---

**移行完了日**: 2025年1月
**ステータス**: ✅ 移行完了（Gemini APIキーの設定が必要）






