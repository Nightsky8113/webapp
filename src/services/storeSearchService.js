/**
 * 店舗検索APIの抽象化レイヤー
 * 環境変数に基づいてAPIプロバイダーを切り替え可能にし、将来的にGoogle Places APIへの移行を容易にする
 * 現在はOverpass API（無料）を使用し、将来的にGoogle Places APIへの切り替えが可能
 */

import { searchNearbyStores as searchWithOverpassAPI } from './overpassApi.js';

const API_PROVIDER = import.meta.env.VITE_STORE_SEARCH_API || 'overpass';

/**
 * 環境変数で指定されたAPIプロバイダーを使用して近くの店舗を検索する
 * 現在はOverpass APIのみ対応、将来的にGoogle Places APIにも対応予定
 */
export async function searchNearbyStores(lat, lng, radius = 2000) {
    switch (API_PROVIDER) {
        case 'places':
            console.warn('Google Places APIはまだ実装されていません。Overpass APIを使用します。');
            return await searchWithOverpassAPI(lat, lng, radius);
        case 'overpass':
        default:
            return await searchWithOverpassAPI(lat, lng, radius);
    }
}

/**
 * 複数のAPIプロバイダーから検索結果を取得し、重複を排除して統合する
 * 将来的にOverpass APIとGoogle Places APIの両方を使用する場合に備えた機能
 */
export async function searchWithBothAPIs(lat, lng, radius = 2000) {
    const results = await Promise.allSettled([
        searchWithOverpassAPI(lat, lng, radius)
    ]);

    const stores = [];
    const processedIds = new Set();

    if (results[0].status === 'fulfilled') {
        results[0].value.forEach(store => {
            const key = `${store.latitude}_${store.longitude}`;
            if (!processedIds.has(key)) {
                stores.push(store);
                processedIds.add(key);
            }
        });
    }

    return stores;
}

