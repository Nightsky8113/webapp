/**
 * 徒歩時間計算サービス
 * OSRM APIを使用して最寄り駅から店舗までの徒歩時間を計算し、データベースに保存する。
 * 一度計算した徒歩時間はデータベースに保存されるため、次回以降はAPIを呼び出さずに取得できる。
 */

import { supabase, supabaseInitialized } from './supabase.js';

/**
 * OSRM APIを使用して2点間の徒歩ルートと時間を取得する
 * @param {number} stationLat - 最寄り駅の緯度
 * @param {number} stationLng - 最寄り駅の経度
 * @param {number} storeLat - 店舗の緯度
 * @param {number} storeLng - 店舗の経度
 * @returns {Promise<Object|null>} {distance: メートル, duration: 秒, walkMinutes: 分} または null
 */
export async function calculateWalkingRoute(stationLat, stationLng, storeLat, storeLng) {
    try {
        // OSRM APIエンドポイント（パブリックインスタンス）
        // 経度,緯度;経度,緯度の形式で座標を指定
        const url = `https://router.project-osrm.org/route/v1/walking/${stationLng},${stationLat};${storeLng},${storeLat}?overview=false&steps=false`;
        
        console.log('OSRM API: 徒歩ルートを計算中...', { stationLat, stationLng, storeLat, storeLng });
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // APIレスポンスの検証
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.warn('OSRM API: ルートが見つかりませんでした', data);
            return null;
        }
        
        const route = data.routes[0];
        const distance = route.distance; // メートル
        const duration = route.duration; // 秒
        
        // 秒を分に変換（切り上げ）
        const walkMinutes = Math.ceil(duration / 60);
        
        console.log(`OSRM API: 計算完了 - 距離: ${distance.toFixed(0)}m, 時間: ${duration.toFixed(0)}秒 (${walkMinutes}分)`);
        
        return {
            distance: distance,
            duration: duration,
            walkMinutes: walkMinutes
        };
    } catch (error) {
        console.error('OSRM API エラー:', error);
        return null;
    }
}

/**
 * 店舗の徒歩時間を取得する
 * データベースに保存されている場合はそれを使用し、なければAPIで計算して保存する
 * @param {number} storeId - 店舗ID
 * @param {boolean} forceRecalculate - trueの場合、データベースを無視して再計算する
 * @returns {Promise<number|null>} 徒歩時間（分）、取得できない場合はnull
 */
export async function getWalkingTime(storeId, forceRecalculate = false) {
    if (!supabaseInitialized) {
        console.warn('Supabaseが初期化されていません。徒歩時間を取得できません。');
        return null;
    }
    
    // 外部APIから取得した店舗（文字列ID）の場合は処理をスキップ
    if (typeof storeId === 'string' && (storeId.startsWith('overpass_') || storeId.startsWith('api_'))) {
        return null;
    }
    
    // 店舗IDが整数でない場合はエラー
    const numericId = parseInt(storeId);
    if (isNaN(numericId)) {
        console.warn(`無効な店舗ID: ${storeId}`);
        return null;
    }
    
    // 店舗情報を取得
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('summary_walk_minutes, nearest_station_lat, nearest_station_lng, latitude, longitude')
        .eq('id', numericId)
        .single();
    
    if (storeError || !store) {
        console.error('店舗取得エラー:', storeError);
        return null;
    }
    
    // 既に保存されている場合、再計算が要求されていない場合はその値を返す
    if (!forceRecalculate && store.summary_walk_minutes) {
        console.log(`店舗 ${storeId}: 保存済みの徒歩時間 ${store.summary_walk_minutes}分を使用`);
        return store.summary_walk_minutes;
    }
    
    // 最寄り駅の位置情報が必須
    if (!store.nearest_station_lat || !store.nearest_station_lng) {
        console.warn(`店舗 ${storeId}: 最寄り駅の位置情報がありません`);
        return null;
    }
    
    // 店舗の位置情報も必須
    if (!store.latitude || !store.longitude) {
        console.warn(`店舗 ${storeId}: 店舗の位置情報がありません`);
        return null;
    }
    
    // OSRM APIで徒歩時間を計算
    const routeInfo = await calculateWalkingRoute(
        store.nearest_station_lat,
        store.nearest_station_lng,
        store.latitude,
        store.longitude
    );
    
    if (!routeInfo) {
        console.warn(`店舗 ${storeId}: 徒歩時間の計算に失敗しました`);
        return null;
    }
    
    const walkMinutes = routeInfo.walkMinutes;
    
    // データベースに保存
    const { error: updateError } = await supabase
        .from('stores')
        .update({ summary_walk_minutes: walkMinutes })
        .eq('id', storeId);
    
    if (updateError) {
        console.error('徒歩時間保存エラー:', updateError);
        // エラーが発生しても計算結果は返す
    } else {
        console.log(`店舗 ${storeId}: 徒歩時間 ${walkMinutes}分をデータベースに保存しました`);
    }
    
    return walkMinutes;
}

/**
 * 複数の店舗の徒歩時間を一括で計算・更新する
 * APIレート制限を避けるため、各リクエストの間に1秒待機する
 * @param {Array<number>} storeIds - 店舗IDの配列
 * @returns {Promise<Object>} 結果 {success: Array, failed: Array}
 */
export async function batchUpdateWalkingTimes(storeIds) {
    const results = { success: [], failed: [] };
    
    console.log(`${storeIds.length}件の店舗の徒歩時間を一括計算します...`);
    
    for (let i = 0; i < storeIds.length; i++) {
        const storeId = storeIds[i];
        console.log(`[${i + 1}/${storeIds.length}] 店舗 ${storeId} の徒歩時間を計算中...`);
        
        const walkMinutes = await getWalkingTime(storeId, true); // 強制再計算
        
        if (walkMinutes !== null) {
            results.success.push({ storeId, walkMinutes });
        } else {
            results.failed.push(storeId);
        }
        
        // APIレート制限を避けるため、最後のリクエスト以外は1秒待機
        if (i < storeIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`一括計算完了: 成功 ${results.success.length}件, 失敗 ${results.failed.length}件`);
    
    return results;
}



