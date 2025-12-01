/**
 * Google Cloud Vision API統合サービス
 * チラシ画像からテキストを抽出するOCR処理を実行する
 * コンテスト用途のため、無料枠内で運用する
 */

/**
 * 画像からテキストを抽出する（OCR処理）
 * @param {string} imageUrl - 画像のURL（公開URLである必要がある）
 * @returns {Promise<Object>} {success: boolean, text?: string, error?: string}
 */
export async function extractTextFromImage(imageUrl) {
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
        console.warn('Google Cloud Vision APIキーが設定されていません');
        return {
            success: false,
            error: 'Google Cloud Vision APIキーが設定されていません。環境変数VITE_GOOGLE_CLOUD_VISION_API_KEYを設定してください。'
        };
    }

    try {
        // 画像をBase64にエンコードする必要があるため、まず画像を取得
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`画像の取得に失敗しました: ${imageResponse.status}`);
        }
        
        const imageBlob = await imageResponse.blob();
        const imageBase64 = await blobToBase64(imageBlob);

        // Google Cloud Vision APIにリクエストを送信
        const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        
        const requestBody = {
            requests: [
                {
                    image: {
                        content: imageBase64.split(',')[1] // data:image/...;base64, の部分を除去
                    },
                    features: [
                        {
                            type: 'TEXT_DETECTION',
                            maxResults: 1
                        }
                    ]
                }
            ]
        };

        console.log('Google Cloud Vision API: OCR処理を実行中...', { imageUrl });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Vision APIエラー: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        // レスポンスからテキストを抽出
        if (!data.responses || !data.responses[0]) {
            return {
                success: false,
                error: 'OCR処理の結果が空です'
            };
        }

        const textAnnotations = data.responses[0].textAnnotations;
        
        if (!textAnnotations || textAnnotations.length === 0) {
            return {
                success: false,
                error: '画像からテキストを検出できませんでした'
            };
        }

        // 最初の要素に全テキストが含まれている
        const extractedText = textAnnotations[0].description || '';
        
        console.log('Google Cloud Vision API: OCR処理完了', { 
            textLength: extractedText.length,
            textPreview: extractedText.substring(0, 100) + '...'
        });

        return {
            success: true,
            text: extractedText
        };
    } catch (error) {
        console.error('Google Cloud Vision API エラー:', error);
        return {
            success: false,
            error: `OCR処理に失敗しました: ${error.message}`
        };
    }
}

/**
 * BlobをBase64文字列に変換する
 * @param {Blob} blob - 変換するBlob
 * @returns {Promise<string>} Base64文字列
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


