/**
 * データサービス（Supabase対応版）
 * PostgreSQLからデータを取得
 */

import { supabase, supabaseInitialized } from './supabase.js';

// データキャッシュ（オプション: パフォーマンス向上）
let cache = {
    stores: null,
    flyers: null,
    items: null,
    genres: null,
    cacheTime: {}
};

const CACHE_DURATION = 5 * 60 * 1000; // 5分

/**
 * キャッシュが有効かチェック
 */
function isCacheValid(key) {
    if (!cache[key] || !cache.cacheTime[key]) return false;
    return Date.now() - cache.cacheTime[key] < CACHE_DURATION;
}

/**
 * 全店舗を取得
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
 * 店舗IDで店舗を取得
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
 * 全チラシを取得
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
 * 店舗の最新チラシを取得
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
        // データが見つからない場合は最新のチラシを返す
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
 * 全商品を取得
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
 * チラシIDで商品を取得
 */
export async function getItemsByFlyerId(flyerId) {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('flyer_id', parseInt(flyerId))
        .order('price', { ascending: false }); // 価格の高い順

    if (error) {
        console.error('商品取得エラー:', error);
        return [];
    }

    return data;
}

/**
 * ジャンルIDで商品を取得
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
 * 全ジャンルを取得
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
 * ジャンルIDでジャンルを取得
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
 * 今日更新されたチラシを取得
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
 * ジャンルを扱う店舗を取得
 */
export async function getStoresByGenreId(genreId) {
    // 1. 該当ジャンルの商品を取得
    const items = await getItemsByGenreId(genreId);
    const flyerIds = [...new Set(items.map(item => item.flyer_id))];

    if (flyerIds.length === 0) return [];

    // 2. チラシから店舗IDを取得
    const { data: flyers, error: flyersError } = await supabase
        .from('flyers')
        .select('store_id')
        .in('id', flyerIds);

    if (flyersError) {
        console.error('チラシ取得エラー:', flyersError);
        return [];
    }

    const storeIds = [...new Set(flyers.map(f => f.store_id))];

    // 3. 店舗を取得
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
 * キャッシュをクリア
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