# PowerShell実行ポリシーエラー解決方法

## 🔍 問題

`npm run dev`を実行すると、以下のエラーが表示される：

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

## ✅ 解決方法

### 方法1: 実行ポリシーを一時的に変更（推奨）

現在のセッションでのみ有効な方法：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
npm run dev
```

### 方法2: PowerShellをバイパスして実行

```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

### 方法3: cmdプロンプトを使用（最も簡単）

1. PowerShellを閉じる
2. **cmd**（コマンドプロンプト）を開く
3. プロジェクトディレクトリに移動
   ```cmd
   cd C:\Users\Owner\Desktop\webapp
   ```
4. コマンドを実行
   ```cmd
   npm run dev
   ```

### 方法4: npxを使用

```powershell
npx --yes npm run dev
```

### 方法5: 実行ポリシーを永続的に変更（管理者権限が必要）

**注意**: セキュリティ上の理由から、推奨しません。

```powershell
# 管理者権限でPowerShellを開いて実行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📋 推奨される方法

**開発時**: 方法3（cmdプロンプト）が最も簡単で安全です。

**スクリプトで自動化する場合**: 方法1（一時的な変更）を使用します。

---

**最終更新**: 2025年1月


