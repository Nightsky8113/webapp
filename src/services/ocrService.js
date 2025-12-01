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
            }
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
        }
    } catch (error) {
        console.error('OCRステータス更新エラー:', error);
    }
}

