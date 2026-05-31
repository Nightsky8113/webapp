/**
 * Supabaseデータベースへのデータアクセスを提供するサービス層
 * 店舗、チラシ、商品、ジャンルなどのデータ取得とキャッシュ管理を行う
 */

import { supabase, supabaseInitialized } from './supabase.js';
import { reverseGeocode } from './geocodingService.js';

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
 * 指定された店舗の住所を更新する
 * @param {number|string} storeId
 * @param {string} address
 * @returns {Promise<Object>} {success: boolean, store?: Object, error?: string}
 */
export async function updateStoreAddress(storeId, address) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。'
        };
    }

    if (!address || !address.trim()) {
        return {
            success: false,
            error: '住所が指定されていません。'
        };
    }

    const { data, error } = await supabase
        .from('stores')
        .update({ address: address.trim() })
        .eq('id', parseInt(storeId))
        .select()
        .single();

    if (error) {
        console.error('住所更新エラー:', error);
        return {
            success: false,
            error: error.message || '住所更新に失敗しました。'
        };
    }

    clearCache();

    return {
        success: true,
        store: data
    };
}

/**
 * storesテーブル内のすべてのデータを削除する
 * 注意: これは非常に危険な操作です。関連するflyers、items、favoritesなどのデータもCASCADE削除されます
 * @returns {Promise<Object>} {success: boolean, deletedCount?: number, error?: string}
 */
export async function deleteAllStores() {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。'
        };
    }

    try {
        // すべての店舗IDを取得
        const { data: stores, error: fetchError } = await supabase
            .from('stores')
            .select('id');

        if (fetchError) {
            console.error('店舗取得エラー:', fetchError);
            return {
                success: false,
                error: `店舗データの取得に失敗しました: ${fetchError.message || fetchError}`
            };
        }

        if (!stores || stores.length === 0) {
            return {
                success: true,
                deletedCount: 0
            };
        }

        const storeIds = stores.map(store => store.id);
        const deletedCount = storeIds.length;

        console.log(`削除対象: ${deletedCount}件の店舗`);

        // すべての店舗を削除（CASCADEにより関連データも自動削除）
        // 個別に削除してエラーを詳細に確認
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        
        for (const storeId of storeIds) {
            const { data, error: singleError } = await supabase
                .from('stores')
                .delete()
                .eq('id', storeId)
                .select(); // 削除されたレコードを返す
            
            if (singleError) {
                console.error(`店舗ID ${storeId} の削除エラー:`, singleError);
                console.error('エラー詳細:', JSON.stringify(singleError, null, 2));
                errors.push(`ID ${storeId}: ${singleError.message || singleError.code || singleError}`);
                failCount++;
            } else {
                console.log(`店舗ID ${storeId} を削除しました`);
                successCount++;
            }
        }
        
        if (failCount > 0) {
            const errorMessage = errors.length > 0 
                ? errors.join(', ') 
                : `${failCount}件の削除に失敗しました`;
            
            console.error('削除失敗の詳細:', {
                successCount,
                failCount,
                errors
            });
            
            return {
                success: false,
                error: `${successCount}件削除成功、${failCount}件削除失敗。エラー: ${errorMessage}。\n\n注意: SupabaseのRLS（Row Level Security）ポリシーでDELETE権限が設定されていない可能性があります。`
            };
        }

        // 削除後の確認
        const { data: remainingStores, count, error: verifyError } = await supabase
            .from('stores')
            .select('id', { count: 'exact', head: true });
        
        if (verifyError) {
            console.warn('削除後の確認でエラー:', verifyError);
        }
        
        if (count !== undefined && count > 0) {
            console.warn(`削除後も${count}件の店舗が残っています`);
            return {
                success: false,
                error: `一部の店舗が削除されませんでした。残り: ${count}件。\n\n注意: SupabaseのRLS（Row Level Security）ポリシーでDELETE権限が設定されていない可能性があります。\n\n解決方法: Supabase DashboardのSQL Editorで以下のマイグレーションを実行してください:\nsupabase/migrations/005_add_delete_policies.sql`
            };
        }

        // キャッシュをクリア
        clearCache();

        console.log(`削除完了: ${deletedCount}件の店舗を削除しました`);

        return {
            success: true,
            deletedCount: deletedCount
        };
    } catch (error) {
        console.error('店舗削除エラー:', error);
        console.error('エラースタック:', error.stack);
        return {
            success: false,
            error: `店舗データの削除中にエラーが発生しました: ${error.message || error}`
        };
    }
}

/**
 * 指定されたチラシIDに関連する商品情報を削除する
 * @param {number} flyerId - チラシID
 * @returns {Promise<Object>} {success: boolean, error?: string}
 */
async function deleteItemsByFlyerId(flyerId) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。'
        };
    }

    try {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('flyer_id', flyerId);

        if (error) {
            console.error(`チラシID ${flyerId} の商品削除エラー:`, error);
            return {
                success: false,
                error: `商品情報の削除に失敗しました: ${error.message}`
            };
        }

        return {
            success: true
        };
    } catch (error) {
        console.error('商品情報の削除エラー:', error);
        return {
            success: false,
            error: `予期しないエラーが発生しました: ${error.message}`
        };
    }
}

/**
 * 指定された店舗の古いチラシ（is_latest = false）に関連する商品情報を削除する
 * 新しいチラシがアップロードされた際に、古い商品情報をクリーンアップするために使用
 * @param {number} storeId - 店舗ID
 * @returns {Promise<Object>} {success: boolean, deletedCount?: number, error?: string}
 */
async function deleteItemsByOldFlyers(storeId) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。'
        };
    }

    try {
        // 指定された店舗の古いチラシ（is_latest = false）のIDを取得
        const { data: oldFlyers, error: flyersError } = await supabase
            .from('flyers')
            .select('id')
            .eq('store_id', parseInt(storeId))
            .eq('is_latest', false);

        if (flyersError) {
            console.error('古いチラシ取得エラー:', flyersError);
            return {
                success: false,
                error: `古いチラシの取得に失敗しました: ${flyersError.message}`
            };
        }

        // 古いチラシが存在しない場合は削除する商品もない
        if (!oldFlyers || oldFlyers.length === 0) {
            return {
                success: true,
                deletedCount: 0
            };
        }

        // 古いチラシに関連する商品を削除
        let deletedCount = 0;
        for (const flyer of oldFlyers) {
            const result = await deleteItemsByFlyerId(flyer.id);
            if (result.success) {
                deletedCount++;
            }
        }

        // キャッシュをクリアして最新データを取得できるようにする
        clearCache();

        return {
            success: true,
            deletedCount: deletedCount
        };
    } catch (error) {
        console.error('古い商品情報の削除エラー:', error);
        return {
            success: false,
            error: `商品情報の削除に失敗しました: ${error.message}`
        };
    }
}

/**
 * 新しいチラシレコードをデータベースに作成する
 * 新規チラシがis_latest=trueの場合、同じ店舗の既存チラシのis_latestをfalseに更新して一貫性を保つ
 * また、古いチラシ（is_latest = false）に関連する商品情報を削除してデータをクリーンアップする
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
            // ステップ1: 既存の最新チラシ（is_latest = true）のIDを取得して、その商品を削除
            const { data: currentLatestFlyers, error: fetchError } = await supabase
                .from('flyers')
                .select('id')
                .eq('store_id', parseInt(store_id))
                .eq('is_latest', true);

            if (!fetchError && currentLatestFlyers && currentLatestFlyers.length > 0) {
                // 既存の最新チラシの商品を削除
                for (const flyer of currentLatestFlyers) {
                    await deleteItemsByFlyerId(flyer.id);
                }
            }

            // ステップ2: 既存チラシのis_latestフラグをfalseに更新
            const { error: updateError } = await supabase
                .from('flyers')
                .update({ is_latest: false })
                .eq('store_id', parseInt(store_id))
                .eq('is_latest', true);

            if (updateError) {
                console.error('既存チラシの更新エラー:', updateError);
            }

            // ステップ3: 既にis_latest = falseになっている古いチラシの商品も削除（クリーンアップ）
            const cleanupResult = await deleteItemsByOldFlyers(parseInt(store_id));
            // 古いチラシの商品情報を削除（ログは出力しない）
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

    let resolvedAddress = address && address.trim() !== '' ? address.trim() : null;
    if (!resolvedAddress && latitude !== undefined && longitude !== undefined) {
        resolvedAddress = await reverseGeocode(latitude, longitude);
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
            if (existingStore && (!existingStore.address || existingStore.address.trim() === '') && resolvedAddress) {
                const { data: updatedStore, error: updateError } = await supabase
                    .from('stores')
                    .update({ address: resolvedAddress })
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
            address: resolvedAddress || null,
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