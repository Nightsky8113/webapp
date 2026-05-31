/**
 * 店舗ID・位置・ナビゲーションに関する共通ヘルパー
 */

import { STORE_DUPLICATE_THRESHOLD } from './constants.js';
import { getQueryParamsFromHash } from './helpers.js';

/** /store/:storeId にマッチさせない固定パス */
export const RESERVED_STORE_PATHS = new Set(['upload', 'register', 'login']);

const EXTERNAL_ID_PREFIXES = ['overpass_', 'api_'];

export function isExternalStoreId(storeId) {
    if (storeId == null || storeId === '') return false;
    const id = String(storeId);
    return EXTERNAL_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

export function isExternalStore(store) {
    if (!store) return false;
    return Boolean(store.is_from_api || isExternalStoreId(store.id));
}

export function toValidStoreId(storeId) {
    if (storeId == null || storeId === '') return null;
    if (typeof storeId === 'string') {
        if (RESERVED_STORE_PATHS.has(storeId)) return null;
        if (isExternalStoreId(storeId)) return null;
    }
    const id = parseInt(String(storeId), 10);
    return Number.isFinite(id) && id > 0 ? id : null;
}

export function isSameStoreLocation(storeA, storeB, threshold = STORE_DUPLICATE_THRESHOLD) {
    if (!storeA || !storeB) return false;
    const latDiff = Math.abs(storeA.latitude - storeB.latitude);
    const lngDiff = Math.abs(storeA.longitude - storeB.longitude);
    return latDiff < threshold && lngDiff < threshold;
}

export function buildStoreDetailHash(storeId, queryParams = null) {
    const id = toValidStoreId(storeId);
    if (id == null) return '#/home';

    const params = queryParams instanceof URLSearchParams
        ? queryParams
        : getQueryParamsFromHash();

    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng) {
        return `#/store/${id}?lat=${lat}&lng=${lng}`;
    }
    return `#/store/${id}`;
}

export function navigateToStoreDetail(storeId) {
    if (isExternalStoreId(storeId)) return;
    const hash = buildStoreDetailHash(storeId);
    if (hash !== '#/home') {
        window.location.hash = hash.slice(1);
    }
}
