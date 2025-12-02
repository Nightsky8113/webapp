/**
 * Google Gemini API統合サービス
 * OCRで抽出したテキストを商品情報として構造化する
 * コンテスト用途のため、無料枠内で運用する
 * 
 * Google Gemini APIは個人開発・テスト目的であれば、ほぼ無制限に無料で利用可能
 */

import { getGenres } from './dataService.js';

/**
 * OCRで抽出したテキストを商品情報として構造化する
 * @param {string} ocrText - OCRで抽出したテキスト
 * @param {number} storeId - 店舗ID（商品のジャンルを推測するために使用）
 * @returns {Promise<Object>} {success: boolean, items?: Array, error?: string}
 */
export async function structureOCRText(ocrText, storeId) {
    const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
        console.warn('⚠️ Google Gemini APIキーが設定されていません');
        return {
            success: false,
            error: 'Google Gemini APIキーが設定されていません。\n環境変数 VITE_GOOGLE_GEMINI_API_KEY を設定してください。\n\n設定方法:\n1. Google AI StudioでAPIキーを取得\n2. .envファイルに VITE_GOOGLE_GEMINI_API_KEY=your-api-key を追加\n3. 開発サーバーを再起動'
        };
    }

    if (!ocrText || ocrText.trim().length === 0) {
        return {
            success: false,
            error: 'OCRテキストが空です'
        };
    }

    try {
        // Gemini 2.0 Flashを使用（無料枠で利用可能、高速）
        const model = 'gemini-2.0-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        // ジャンルリストを取得
        const genres = await getGenres();
        const prompt = createPrompt(ocrText, storeId, genres);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3, // 一貫性を重視
                    maxOutputTokens: 2000,
                    responseMimeType: 'application/json' // JSON形式で返す
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
            
            // よくあるエラーの説明を追加
            if (response.status === 400) {
                throw new Error(`APIリクエストが無効です: ${errorMessage}`);
            } else if (response.status === 403) {
                throw new Error(`APIキーが無効または権限がありません: ${errorMessage}`);
            } else if (response.status === 429) {
                throw new Error(`API使用量制限に達しました。しばらく待ってから再試行してください: ${errorMessage}`);
            } else {
                throw new Error(`Gemini APIエラー: ${response.status} - ${errorMessage}`);
            }
        }

        const data = await response.json();
        
        // レスポンスからテキストを取得
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            return {
                success: false,
                error: 'Gemini APIからの応答が空です'
            };
        }

        // JSONをパース
        let items = [];
        try {
            // JSONコードブロックがある場合は除去
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                             content.match(/```\s*([\s\S]*?)\s*```/) ||
                             [null, content];
            const jsonText = jsonMatch[1] || content;
            const parsed = JSON.parse(jsonText);
            
            // 配列形式かオブジェクト形式かを判定
            if (Array.isArray(parsed)) {
                items = parsed;
            } else if (parsed.items && Array.isArray(parsed.items)) {
                items = parsed.items;
            } else {
                items = [parsed];
            }
        } catch (parseError) {
            console.warn('JSON解析エラー:', parseError);
            return {
                success: false,
                error: `JSON解析に失敗しました: ${parseError.message}`
            };
        }

        // データの検証と整形
        items = items
            .filter(item => item && item.name && item.price)
            .map(item => ({
                name: String(item.name || '').trim(),
                price: parseFloat(item.price) || 0,
                description: String(item.description || '').trim(),
                genre: String(item.genre || item.category || '').trim() // genreまたはcategoryの両方に対応
            }))
            .filter(item => item.name.length > 0 && item.price > 0);

        return {
            success: true,
            items: items
        };
    } catch (error) {
        console.error('Google Gemini API エラー:', error);
        return {
            success: false,
            error: `テキスト構造化に失敗しました: ${error.message}`
        };
    }
}

/**
 * Gemini API用のプロンプトを作成する
 * @param {string} ocrText - OCRで抽出したテキスト
 * @param {number} storeId - 店舗ID
 * @param {Array} genres - ジャンルリスト
 * @returns {string} プロンプトテキスト
 */
function createPrompt(ocrText, storeId, genres = []) {
    // OCRテキストが長すぎる場合は切り詰める（Gemini APIのトークン制限を考慮）
    const maxTextLength = 50000; // 安全のため50,000文字に制限
    const truncatedText = ocrText.length > maxTextLength 
        ? ocrText.substring(0, maxTextLength) + '\n...（テキストが長いため一部を省略）'
        : ocrText;
    
    // ジャンルリストを文字列形式に変換
    const genresList = genres.map(g => `- ${g.name}`).join('\n');
    const genresNames = genres.map(g => g.name).join('、');
    
    return `
あなたはチラシから商品情報を抽出する専門家です。OCRで抽出されたテキストから、商品名、価格、説明、ジャンルなどの情報を構造化してJSON形式で返してください。

【OCRテキスト】
${truncatedText}

【利用可能なジャンル一覧】
以下のジャンルから、各商品に最も適切なジャンルを1つ選択してください。該当するジャンルがない場合は、最も近いジャンルを選択してください。
${genresList}

【抽出する情報】
- name: 商品名（必須、文字列）
- price: 価格（必須、数値のみ、単位（円など）は含めない）
- description: 商品説明（任意、文字列）
- genre: ジャンル（必須、文字列。上記のジャンル一覧から選択。ジャンル名は完全一致してください）

【重要な注意事項】
1. 商品名と価格が両方揃っているもののみ抽出してください
2. 価格は数値のみで、単位（円、¥など）は含めないでください
3. 不確実な情報や推測した情報は含めないでください
4. ジャンルは必ず上記のジャンル一覧（${genresNames}）の中から選択してください
5. ジャンル名は完全一致する必要があります（例：「精肉」「鮮魚」「野菜」など）
6. 必ず有効なJSON配列形式で返してください
7. 商品が見つからない場合は空配列 [] を返してください

【出力形式】
JSON配列形式で返してください。例:
[
  {
    "name": "国産牛ロース",
    "price": 1980,
    "description": "国産牛肉",
    "genre": "精肉"
  },
  {
    "name": "本マグロ刺身",
    "price": 1500,
    "description": "新鮮なマグロ",
    "genre": "鮮魚"
  },
  {
    "name": "トマト",
    "price": 280,
    "description": "",
    "genre": "野菜"
  }
]

必ず有効なJSON形式で返してください。JSON以外のテキストは含めないでください。
ジャンルは必ず「${genresNames}」の中から選択してください。
`;
}



