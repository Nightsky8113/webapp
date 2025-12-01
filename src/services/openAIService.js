/**
 * OpenAI API統合サービス
 * OCRで抽出したテキストを商品情報として構造化する
 * コンテスト用途のため、無料枠内で運用する
 */

/**
 * OCRで抽出したテキストを商品情報として構造化する
 * @param {string} ocrText - OCRで抽出したテキスト
 * @param {number} storeId - 店舗ID（商品のジャンルを推測するために使用）
 * @returns {Promise<Object>} {success: boolean, items?: Array, error?: string}
 */
export async function structureOCRText(ocrText, storeId) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
        console.warn('OpenAI APIキーが設定されていません');
        return {
            success: false,
            error: 'OpenAI APIキーが設定されていません。環境変数VITE_OPENAI_API_KEYを設定してください。'
        };
    }

    if (!ocrText || ocrText.trim().length === 0) {
        return {
            success: false,
            error: 'OCRテキストが空です'
        };
    }

    try {
        // GPT-3.5 Turboを使用（コスト削減）
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        
        const prompt = createPrompt(ocrText, storeId);
        
        console.log('OpenAI API: テキスト構造化処理を実行中...', { 
            textLength: ocrText.length,
            storeId 
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'あなたはチラシから商品情報を抽出する専門家です。OCRで抽出されたテキストから、商品名、価格、説明などの情報を構造化してJSON形式で返してください。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3, // 一貫性を重視
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI APIエラー: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        // レスポンスからテキストを取得
        const content = data.choices[0]?.message?.content;
        
        if (!content) {
            return {
                success: false,
                error: 'OpenAI APIからの応答が空です'
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
            console.warn('JSON解析エラー、テキストをそのまま返します:', parseError);
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
                category: String(item.category || '').trim()
            }))
            .filter(item => item.name.length > 0 && item.price > 0);

        console.log('OpenAI API: テキスト構造化処理完了', { 
            itemsCount: items.length,
            itemsPreview: items.slice(0, 3)
        });

        return {
            success: true,
            items: items
        };
    } catch (error) {
        console.error('OpenAI API エラー:', error);
        return {
            success: false,
            error: `テキスト構造化に失敗しました: ${error.message}`
        };
    }
}

/**
 * OpenAI API用のプロンプトを作成する
 * @param {string} ocrText - OCRで抽出したテキスト
 * @param {number} storeId - 店舗ID
 * @returns {string} プロンプトテキスト
 */
function createPrompt(ocrText, storeId) {
    return `
以下のOCRテキストから、商品情報を抽出してJSON形式で返してください。

【OCRテキスト】
${ocrText.substring(0, 3000)}${ocrText.length > 3000 ? '...' : ''}

【抽出する情報】
- name: 商品名（必須）
- price: 価格（数値のみ、必須）
- description: 商品説明（任意）
- category: カテゴリ（任意）

【出力形式】
JSON配列形式で返してください。例:
[
  {
    "name": "商品名1",
    "price": 100,
    "description": "商品説明1",
    "category": "カテゴリ1"
  },
  {
    "name": "商品名2",
    "price": 200,
    "description": "商品説明2",
    "category": "カテゴリ2"
  }
]

商品名と価格が両方揃っているもののみ抽出してください。不確実な情報は含めないでください。
`;
}



