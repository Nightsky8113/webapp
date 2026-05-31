/**
 * 近隣店舗の検索・DB統合・一覧ページ用キャッシュ
 */

import { getStores, getFlyers, addStoreIfNotExists } from './dataService.js';
import { searchNearbyStores } from './storeSearchService.js';
import { sortByDistance } from '../utils/distance.js';
import { isExternalStore, isSameStoreLocation } from '../utils/storeHelpers.js';
import { STORE_SEARCH_RADIUS, MAX_STORES_DISPLAY } from '../utils/constants.js';

let storesPageCache = null;

export function getStoresPageCache() {
    return storesPageCache;
}

export function clearStoresPageCache() {
    storesPageCache = null;
}

/**
 * Overpass結果をDBに取り込み、距離順の一覧を返す
 */
export async function mergeNearbyStores(userLocation, dbStores, apiStores) {
    let existingStores = [...dbStores];
    let hasNewStore = false;

    for (const apiStore of apiStores) {
        try {
            const result = await addStoreIfNotExists(
                {
                    name: apiStore.name,
                    latitude: apiStore.latitude,
                    longitude: apiStore.longitude,
                    address: apiStore.address || ''
                },
                { existingStores, skipGeocode: true }
            );

            if (!result.success || !result.store) continue;

            if (result.isNew) {
                hasNewStore = true;
                existingStores.push(result.store);
            } else {
                const idx = existingStores.findIndex((s) => s.id === result.store.id);
                if (idx >= 0) {
                    existingStores[idx] = result.store;
                }
            }
        } catch (error) {
            console.error('店舗追加エラー:', error);
        }
    }

    if (hasNewStore) {
        existingStores = await getStores(true);
    }

    const allStores = [...existingStores];

    for (const apiStore of apiStores) {
        const inDb = existingStores.some((dbStore) => isSameStoreLocation(dbStore, apiStore));
        if (!inDb) {
            allStores.push({
                ...apiStore,
                id: apiStore.id || `api_${apiStore.latitude}_${apiStore.longitude}`,
                is_from_api: true
            });
        }
    }

    return sortByDistance(allStores, userLocation).slice(0, MAX_STORES_DISPLAY);
}

/**
 * 店舗一覧ページ用データを取得し、地図用キャッシュに保存する
 */
export async function prepareStoresPageData(userLocation) {
    clearStoresPageCache();

    const [stores, flyers] = await Promise.all([getStores(), getFlyers()]);

    let apiStores = [];
    try {
        apiStores = await searchNearbyStores(
            userLocation.lat,
            userLocation.lng,
            STORE_SEARCH_RADIUS
        );
    } catch (error) {
        console.error('店舗検索エラー:', error);
    }

    const storesWithDistance = await mergeNearbyStores(userLocation, stores, apiStores);

    const pageData = { storesWithDistance, userLocation, flyers };
    storesPageCache = pageData;
    return pageData;
}

/**
 * 店舗に紐づく最新チラシを flyers 一覧から取得
 */
export function findLatestFlyerForStore(flyers, store) {
    if (isExternalStore(store)) return null;
    return flyers.find((f) => f.store_id === store.id && f.is_latest) ?? null;
}
