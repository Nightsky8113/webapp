/**
 * OCR処理統合サービス
 * Google Cloud Vision APIとOpenAI APIを組み合わせて、チラシ画像から商品情報を自動抽出する
 * コンテスト用途のため、無料枠内で運用する
 */

import { extractTextFromImage } from './visionService.js';
import { structureOCRText } from './geminiService.js';
import { supabase, supabaseInitialized } from './supabase.js';

/**
 * チラシ画像から商品情報を自動抽出する（OCR処理 + 構造化）
 * @param {string} imageUrl - チラシ画像のURL
 * @param {number} flyerId - チラシID
 * @param {number} storeId - 店舗ID
 * @returns {Promise<Object>} {success: boolean, items?: Array, error?: string}
 */
export async function processFlyerOCR(imageUrl, flyerId, storeId) {
    console.log('OCR処理開始:', { imageUrl, flyerId, storeId });

    // ステップ1: Google Cloud Vision APIでテキスト抽出
    console.log('ステップ1: テキスト抽出中...');
    const ocrResult = await extractTextFromImage(imageUrl);
    
    if (!ocrResult.success || !ocrResult.text) {
        return {
            success: false,
            error: ocrResult.error || 'テキスト抽出に失敗しました'
        };
    }

    console.log('テキスト抽出完了:', { textLength: ocrResult.text.length });

    // ステップ2: OpenAI APIでテキストを構造化
    console.log('ステップ2: テキスト構造化中...');
    const structureResult = await structureOCRText(ocrResult.text, storeId);
    
    if (!structureResult.success || !structureResult.items) {
        return {
            success: false,
            error: structureResult.error || 'テキスト構造化に失敗しました'
        };
    }

    console.log('テキスト構造化完了:', { itemsCount: structureResult.items.length });

    // ステップ3: 商品情報をデータベースに保存
    if (structureResult.items.length > 0 && supabaseInitialized) {
        console.log('ステップ3: データベースに保存中...');
        const saveResult = await saveItemsToDatabase(structureResult.items, flyerId, storeId);
        
        if (!saveResult.success) {
            console.warn('データベース保存に失敗しました:', saveResult.error);
            // 保存失敗しても、抽出した商品情報は返す
        } else {
            console.log('データベース保存完了:', { savedCount: saveResult.savedCount });
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
 * 抽出した商品情報をデータベースに保存する
 * @param {Array} items - 商品情報の配列
 * @param {number} flyerId - チラシID
 * @param {number} storeId - 店舗ID
 * @returns {Promise<Object>} {success: boolean, savedCount?: number, error?: string}
 */
async function saveItemsToDatabase(items, flyerId, storeId) {
    try {
        // itemsテーブルに商品を保存
        const itemsToInsert = items.map(item => ({
            flyer_id: flyerId,
            store_id: storeId,
            name: item.name,
            price: item.price,
            description: item.description || null,
            category: item.category || null
        }));

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
 * OCR処理完了フラグを更新する
 * @param {number} flyerId - チラシID
 * @param {boolean} ocrDone - OCR処理完了フラグ
 */
async function updateOCRStatus(flyerId, ocrDone) {
    try {
        const { error } = await supabase
            .from('flyers')
            .update({ ocr_done: ocrDone })
            .eq('id', flyerId);

        if (error) {
            console.error('OCRステータス更新エラー:', error);
        } else {
            console.log('OCRステータス更新完了:', { flyerId, ocrDone });
        }
    } catch (error) {
        console.error('OCRステータス更新エラー:', error);
    }
}

