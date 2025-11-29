/**
 * 位置情報取得ユーティリティ
 * ユーザーの現在地を取得する機能を提供
 */

import { getFromLocalStorage, saveToLocalStorage } from './helpers.js';

/**
 * ユーザーの位置情報を取得
 * @returns {Promise<Object>} {lat, lng}
 */
export async function getUserLocation() {
    // LocalStorageから取得を試みる
    const cachedLocation = getFromLocalStorage('userLocation');
    if (cachedLocation) {
        console.log('キャッシュされた位置情報を使用:', cachedLocation);
        return cachedLocation;
    }

    // Geolocation APIで取得を試みる
    if ('geolocation' in navigator) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 600000 // 10分間キャッシュ
                });
            });

            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // LocalStorageに保存
            saveToLocalStorage('userLocation', location);
            console.log('現在地を取得:', location);

            return location;
        } catch (error) {
            console.warn('位置情報の取得に失敗:', error.message);
            throw error;
        }
    } else {
        throw new Error('Geolocation APIが利用できません');
    }
}

/**
 * 位置情報取得のリクエスト（ユーザー確認付き）
 * @returns {Promise<Object>} {lat, lng}
 */
export async function requestUserLocation() {
    return await getUserLocation();
}

/**
 * デフォルト位置を取得（東京駅周辺）
 * @returns {Object} {lat, lng}
 */
export function getDefaultLocation() {
    return { lat: 35.6812, lng: 139.7671 };
}

