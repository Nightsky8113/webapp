/**
 * OCR処理統合サービス
 * Google Cloud Vision APIとGoogle Gemini APIを組み合わせて、チラシ画像から商品情報を自動抽出する
 * コンテスト用途のため、無料枠内で運用する
 * 
 * 処理フロー:
 * 1. Google Cloud Vision APIで画像からテキストを抽出（OCR）
 * 2. Google Gemini APIで抽出したテキストを商品情報として構造化
 * 3. 構造化された商品情報をデータベースに保存
 */

import { extractTextFromImage } from './visionService.js';
import { structureOCRText } from './geminiService.js';
import { supabase, supabaseInitialized } from './supabase.js';
import { getGenres } from './dataService.js';

/**
 * チラシ画像から商品情報を自動抽出する（OCR処理 + 構造化）
 * @param {string} imageUrl - チラシ画像のURL
 * @param {number} flyerId - チラシID
 * @param {number} storeId - 店舗ID
 * @returns {Promise<Object>} {success: boolean, items?: Array, error?: string}
 */
export async function processFlyerOCR(imageUrl, flyerId, storeId) {
    // ステップ1: Google Cloud Vision APIでテキスト抽出
    const ocrResult = await extractTextFromImage(imageUrl);
    
    if (!ocrResult.success || !ocrResult.text) {
        return {
            success: false,
            error: ocrResult.error || 'テキスト抽出に失敗しました'
        };
    }

    // ステップ2: Google Gemini APIでテキストを構造化
    const structureResult = await structureOCRText(ocrResult.text, storeId);
    
    if (!structureResult.success || !structureResult.items) {
        return {
            success: false,
            error: structureResult.error || 'テキスト構造化に失敗しました'
        };
    }

    // ステップ3: 商品情報をデータベースに保存
    if (structureResult.items.length > 0) {
        if (supabaseInitialized) {
            const saveResult = await saveItemsToDatabase(structureResult.items, flyerId, storeId);
            
            if (!saveResult.success) {
                console.warn('データベース保存に失敗しました:', saveResult.error);
                // 保存失敗しても、抽出した商品情報は返す
            } else {
                console.log(`✅ ${saveResult.savedCount}件の商品情報をデータベースに保存しました`);
            }
        } else {
            console.warn('⚠️ Supabaseが初期化されていません。商品情報は抽出されましたが、データベースには保存されませんでした。');
            console.warn('   .envファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定し、開発サーバーを再起動してください。');
        }
    }

    // ステップ4: OCR処理完了フラグを更新
    if (supabaseInitialized) {
        await updateOCRStatus(flyerId, true);
    }

    return {
        success: true,
        items: structureResult.items,
        ocrText: ocrResult.text
    };
}

/**
 * チラシ画像から商品情報を自動抽出する（OCR処理 + 構造化、データベース保存なし）
 * ユーザーが結果を確認してから保存できるように、データベースへの保存は行わない
 * @param {string} imageUrl - チラシ画像のURL
 * @param {number} storeId - 店舗ID（商品のジャンルを推測するために使用）
 * @returns {Promise<Object>} {success: boolean, items?: Array, ocrText?: string, error?: string}
 */
export async function processFlyerOCRWithoutSave(imageUrl, storeId) {
    // ステップ1: Google Cloud Vision APIでテキスト抽出
    const ocrResult = await extractTextFromImage(imageUrl);
    
    if (!ocrResult.success || !ocrResult.text) {
        return {
            success: false,
            error: ocrResult.error || 'テキスト抽出に失敗しました'
        };
    }

    // ステップ2: Google Gemini APIでテキストを構造化
    const structureResult = await structureOCRText(ocrResult.text, storeId);
    
    if (!structureResult.success || !structureResult.items) {
        return {
            success: false,
            error: structureResult.error || 'テキスト構造化に失敗しました'
        };
    }

    // データベースへの保存は行わない（ユーザーが確認してから保存）
    return {
        success: true,
        items: structureResult.items,
        ocrText: ocrResult.text
    };
}

/**
 * 抽出した商品情報をデータベースに保存する（エクスポート）
 * ユーザーがOCR結果を確認した後に手動で保存する際に使用
 * @param {Array} items - 商品情報の配列
 * @param {number} flyerId - チラシID
 * @param {number} storeId - 店舗ID
 * @returns {Promise<Object>} {success: boolean, savedCount?: number, error?: string}
 */
export async function saveOCRItemsToDatabase(items, flyerId, storeId) {
    return await saveItemsToDatabase(items, flyerId, storeId);
}

/**
 * 抽出した商品情報をデータベースに保存する
 * @param {Array} items - 商品情報の配列
 * @param {number} flyerId - チラシID
 * @param {number} storeId - 店舗ID
 * @returns {Promise<Object>} {success: boolean, savedCount?: number, error?: string}
 */
async function saveItemsToDatabase(items, flyerId, storeId) {
    try {
        // ジャンルリストを取得して、ジャンル名からジャンルIDへのマッピングを作成
        const genres = await getGenres();
        const genreMap = new Map(genres.map(g => [g.name, g.id]));
        
        // itemsテーブルに商品を保存
        // スキーマ: id, flyer_id, name, genre_id, price, confidence, bbox_x, bbox_y, bbox_width, bbox_height, created_at
        const itemsToInsert = items.map(item => {
            // ジャンルIDを取得（優先順位: genreId > ジャンル名から検索）
            let genreId = null;
            if (item.genreId) {
                // 既にジャンルIDが設定されている場合
                genreId = parseInt(item.genreId);
            } else {
                // ジャンル名からジャンルIDを取得
                const genreName = item.genre || item.category || '';
                genreId = genreMap.get(genreName) || null;
            }
            
            return {
                flyer_id: flyerId,
                name: item.name,
                genre_id: genreId, // ジャンルIDを設定（見つからない場合はnull）
                price: Math.round(item.price), // INTEGER型なので整数に変換
                // description は items テーブルに存在しないため、保存しない
            };
        }).filter(item => item.name && item.price > 0); // 商品名と価格が有効なもののみ

        const { data, error } = await supabase
            .from('items')
            .insert(itemsToInsert)
            .select();

        if (error) {
            throw error;
        }

        return {
            success: true,
            savedCount: data?.length || 0
        };
    } catch (error) {
        console.error('データベース保存エラー:', error);
        return {
            success: false,
            error: `データベース保存に失敗しました: ${error.message}`
        };
    }
}

/**
 * OCR処理完了フラグを更新する（エクスポート）
 * ユーザーがOCR結果を確認した後に手動で更新する際に使用
 * @param {number} flyerId - チラシID
 * @param {boolean} ocrDone - OCR処理完了フラグ
 */
export async function updateOCRStatus(flyerId, ocrDone) {
    try {
        const { error } = await supabase
            .from('flyers')
            .update({ ocr_done: ocrDone })
            .eq('id', flyerId);

        if (error) {
            console.error('OCRステータス更新エラー:', error);
        }
    } catch (error) {
        console.error('OCRステータス更新エラー:', error);
    }
}

