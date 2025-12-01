/**
 * Supabaseデータベースへのデータアクセスを提供するサービス層
 * 店舗、チラシ、商品、ジャンルなどのデータ取得とキャッシュ管理を行う
 */

import { supabase, supabaseInitialized } from './supabase.js';

// 取得したデータを5分間メモリにキャッシュして、データベースへのリクエストを削減
let cache = {
    stores: null,
    flyers: null,
    items: null,
    genres: null,
    cacheTime: {}
};

const CACHE_DURATION = 5 * 60 * 1000; // 5分

// 店舗の重複判定用の距離閾値（約100m）
const STORE_DUPLICATE_THRESHOLD = 0.001;

/**
 * 指定されたキーのキャッシュが有効期限内かどうかを判定する
 * キャッシュが存在しないか、有効期限を過ぎている場合はfalseを返す
 */
function isCacheValid(key) {
    if (!cache[key] || !cache.cacheTime[key]) return false;
    return Date.now() - cache.cacheTime[key] < CACHE_DURATION;
}

/**
 * データベースから全店舗のリストを取得する
 * キャッシュが有効な場合はデータベースに問い合わせずにキャッシュを返す
 * @param {boolean} forceRefresh - trueの場合、キャッシュを無視してデータベースから最新データを取得
 */
export async function getStores(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('stores')) {
        return cache.stores;
    }

    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('店舗取得エラー:', error);
        return [];
    }

    cache.stores = data;
    cache.cacheTime.stores = Date.now();
    return data;
}

/**
 * 指定されたIDの店舗情報を1件取得する
 * 店舗詳細ページなどで使用される
 */
export async function getStoreById(storeId) {
    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', parseInt(storeId))
        .single();

    if (error) {
        console.error('店舗取得エラー:', error);
        return null;
    }

    return data;
}

/**
 * データベースから全チラシのリストを取得する（更新日の新しい順）
 * キャッシュが有効な場合はデータベースに問い合わせずにキャッシュを返す
 */
export async function getFlyers(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('flyers')) {
        return cache.flyers;
    }

    const { data, error } = await supabase
        .from('flyers')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('チラシ取得エラー:', error);
        return [];
    }

    cache.flyers = data;
    cache.cacheTime.flyers = Date.now();
    return data;
}

/**
 * 指定された店舗の最新チラシを取得する
 * is_latestフラグがtrueのチラシを優先的に取得し、見つからない場合は最新の更新日時のチラシを返す
 */
export async function getLatestFlyerByStoreId(storeId) {
    const { data, error } = await supabase
        .from('flyers')
        .select('*')
        .eq('store_id', parseInt(storeId))
        .eq('is_latest', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // is_latestフラグが設定されていない場合のフォールバック: 最新更新日時のチラシを取得
        const { data: latestData } = await supabase
            .from('flyers')
            .select('*')
            .eq('store_id', parseInt(storeId))
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        return latestData || null;
    }

    return data;
}

/**
 * データベースから全商品のリストを取得する
 * キャッシュが有効な場合はデータベースに問い合わせずにキャッシュを返す
 */
export async function getItems(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('items')) {
        return cache.items;
    }

    const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('商品取得エラー:', error);
        return [];
    }

    cache.items = data;
    cache.cacheTime.items = Date.now();
    return data;
}

/**
 * 指定されたチラシに含まれる商品リストを取得する（価格の高い順）
 * 店舗詳細ページなどでチラシに表示されている商品を表示する際に使用
 */
export async function getItemsByFlyerId(flyerId) {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('flyer_id', parseInt(flyerId))
        .order('price', { ascending: false });

    if (error) {
        console.error('商品取得エラー:', error);
        return [];
    }

    return data;
}

/**
 * 指定されたジャンルに属する商品リストを取得する
 * ジャンル別店舗検索で使用
 */
export async function getItemsByGenreId(genreId) {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('genre_id', parseInt(genreId));

    if (error) {
        console.error('商品取得エラー:', error);
        return [];
    }

    return data;
}

/**
 * データベースから全ジャンルのリストを取得する
 * キャッシュが有効な場合はデータベースに問い合わせずにキャッシュを返す
 */
export async function getGenres(forceRefresh = false) {
    if (!forceRefresh && isCacheValid('genres')) {
        return cache.genres;
    }

    const { data, error } = await supabase
        .from('genres')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('ジャンル取得エラー:', error);
        return [];
    }

    cache.genres = data;
    cache.cacheTime.genres = Date.now();
    return data;
}

/**
 * 指定されたIDのジャンル情報を1件取得する
 * ジャンル名やアイコンを表示する際に使用
 */
export async function getGenreById(genreId) {
    const { data, error } = await supabase
        .from('genres')
        .select('*')
        .eq('id', parseInt(genreId))
        .single();

    if (error) {
        console.error('ジャンル取得エラー:', error);
        return null;
    }

    return data;
}

/**
 * 本日更新されたチラシのリストを取得する
 * ホームページの「今日更新されたチラシ」セクションで使用
 */
export async function getTodayFlyers() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('flyers')
        .select('*')
        .gte('updated_at', today + 'T00:00:00')
        .lte('updated_at', today + 'T23:59:59')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('今日のチラシ取得エラー:', error);
        return [];
    }

    return data;
}

/**
 * 指定されたジャンルの商品を取り扱っている店舗リストを取得する
 * ジャンル→商品→チラシ→店舗という関連をたどって店舗を特定する
 * ジャンル別店舗一覧ページで使用
 */
export async function getStoresByGenreId(genreId) {
    const items = await getItemsByGenreId(genreId);
    const flyerIds = [...new Set(items.map(item => item.flyer_id))];

    if (flyerIds.length === 0) return [];

    const { data: flyers, error: flyersError } = await supabase
        .from('flyers')
        .select('store_id')
        .in('id', flyerIds);

    if (flyersError) {
        console.error('チラシ取得エラー:', flyersError);
        return [];
    }

    const storeIds = [...new Set(flyers.map(f => f.store_id))];

    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .in('id', storeIds);

    if (storesError) {
        console.error('店舗取得エラー:', storesError);
        return [];
    }

    return stores;
}

/**
 * すべてのキャッシュデータをクリアする
 * データ更新後に最新データを取得できるよう、キャッシュを無効化する際に使用
 */
export function clearCache() {
    cache = {
        stores: null,
        flyers: null,
        items: null,
        genres: null,
        cacheTime: {}
    };
}

/**
 * 新しいチラシレコードをデータベースに作成する
 * 新規チラシがis_latest=trueの場合、同じ店舗の既存チラシのis_latestをfalseに更新して一貫性を保つ
 * @param {Object} flyerData - チラシデータ
 * @param {number} flyerData.store_id - 店舗ID
 * @param {string} flyerData.image_url - 画像URL
 * @param {string} flyerData.thumbnail_url - サムネイルURL（省略可能、image_urlと同じになる）
 * @param {boolean} flyerData.is_latest - 最新フラグ（デフォルト: true）
 * @param {boolean} flyerData.ocr_done - OCR処理済みフラグ（デフォルト: false）
 * @returns {Promise<Object>} {success: boolean, data?: Object, error?: string}
 */
export async function createFlyer(flyerData) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。環境変数を確認してください。'
        };
    }

    const {
        store_id,
        image_url,
        thumbnail_url,
        is_latest = true,
        ocr_done = false
    } = flyerData;

    if (!store_id || !image_url) {
        return {
            success: false,
            error: 'store_idとimage_urlは必須です。'
        };
    }

    try {
        // 新規チラシを最新とする場合、同じ店舗の既存チラシのis_latestフラグをfalseに更新
        // これにより、1店舗あたり最新のチラシは1件のみとなる
        if (is_latest) {
            const { error: updateError } = await supabase
                .from('flyers')
                .update({ is_latest: false })
                .eq('store_id', parseInt(store_id))
                .eq('is_latest', true);

            if (updateError) {
                console.error('既存チラシの更新エラー:', updateError);
            }
        }

        const insertData = {
            store_id: parseInt(store_id),
            image_url: image_url,
            thumbnail_url: thumbnail_url || image_url,
            is_latest: is_latest,
            ocr_done: ocr_done,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('flyers')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('チラシ作成エラー:', error);
            return {
                success: false,
                error: `チラシの作成に失敗しました: ${error.message}`
            };
        }

        clearCache();

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('チラシ作成エラー:', error);
        return {
            success: false,
            error: `予期しないエラーが発生しました: ${error.message}`
        };
    }
}

/**
 * 店舗がデータベースに存在するかチェックし、存在しない場合は追加する
 * 位置情報（±100m以内）で重複チェックを行う
 * @param {Object} storeData - 店舗データ
 * @param {string} storeData.name - 店舗名（必須）
 * @param {number} storeData.latitude - 緯度（必須）
 * @param {number} storeData.longitude - 経度（必須）
 * @param {string} storeData.address - 住所（任意）
 * @returns {Promise<Object>} {success: boolean, store?: Object, isNew?: boolean, error?: string}
 */
export async function addStoreIfNotExists(storeData) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。環境変数を確認してください。'
        };
    }

    const { name, latitude, longitude, address } = storeData;

    if (!name || latitude === undefined || longitude === undefined) {
        return {
            success: false,
            error: '店舗名、緯度、経度は必須です。'
        };
    }

    try {
        // 既存の店舗を取得（キャッシュを無視して最新データを取得）
        const existingStores = await getStores(true);

        // 同じ位置（±100m以内）の店舗が存在するかチェック
        const isDuplicate = existingStores.some(dbStore => {
            const latDiff = Math.abs(dbStore.latitude - latitude);
            const lngDiff = Math.abs(dbStore.longitude - longitude);
            return latDiff < STORE_DUPLICATE_THRESHOLD && lngDiff < STORE_DUPLICATE_THRESHOLD;
        });

        if (isDuplicate) {
            // 既存の店舗を返す
            const existingStore = existingStores.find(dbStore => {
                const latDiff = Math.abs(dbStore.latitude - latitude);
                const lngDiff = Math.abs(dbStore.longitude - longitude);
                return latDiff < STORE_DUPLICATE_THRESHOLD && lngDiff < STORE_DUPLICATE_THRESHOLD;
            });
            
            // 既存店舗の住所がNULLで、新しい住所が取得できている場合は住所を更新
            if (existingStore && (!existingStore.address || existingStore.address.trim() === '') && address && address.trim() !== '') {
                const { data: updatedStore, error: updateError } = await supabase
                    .from('stores')
                    .update({ address: address.trim() })
                    .eq('id', existingStore.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('住所更新エラー:', updateError);
                    // 更新に失敗しても既存の店舗情報を返す
                    return {
                        success: true,
                        store: existingStore,
                        isNew: false,
                        addressUpdated: false
                    };
                }
                
                // キャッシュをクリアして最新データを取得できるようにする
                clearCache();
                
                return {
                    success: true,
                    store: updatedStore,
                    isNew: false,
                    addressUpdated: true
                };
            }
            
            return {
                success: true,
                store: existingStore,
                isNew: false,
                addressUpdated: false
            };
        }

        // 新しい店舗を追加
        const insertData = {
            name: name,
            latitude: latitude,
            longitude: longitude,
            address: address || null,
            nearest_station: null,
            nearest_station_lat: null,
            nearest_station_lng: null,
            summary_walk_minutes: null,
            summary_best_item_name: null,
            summary_best_item_price: null,
            summary_best_item_id: null
        };

        const { data, error } = await supabase
            .from('stores')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('店舗追加エラー:', error);
            return {
                success: false,
                error: `店舗の追加に失敗しました: ${error.message}`
            };
        }

        // キャッシュをクリアして最新データを取得できるようにする
        clearCache();

        return {
            success: true,
            store: data,
            isNew: true
        };
    } catch (error) {
        console.error('店舗追加エラー:', error);
        return {
            success: false,
            error: `予期しないエラーが発生しました: ${error.message}`
        };
    }
}

/**
 * 既存のチラシレコードを更新する
 * updated_atは自動的に現在の日時に更新される
 * @param {number} flyerId - 更新するチラシのID
 * @param {Object} updateData - 更新するデータ
 * @returns {Promise<Object>} {success: boolean, data?: Object, error?: string}
 */
export async function updateFlyer(flyerId, updateData) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。環境変数を確認してください。'
        };
    }

    try {
        const dataToUpdate = {
            ...updateData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('flyers')
            .update(dataToUpdate)
            .eq('id', parseInt(flyerId))
            .select()
            .single();

        if (error) {
            console.error('チラシ更新エラー:', error);
            return {
                success: false,
                error: `チラシの更新に失敗しました: ${error.message}`
            };
        }

        clearCache();

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('チラシ更新エラー:', error);
        return {
            success: false,
            error: `予期しないエラーが発生しました: ${error.message}`
        };
    }
}