/**
 * ユーザーの位置情報を取得するユーティリティ
 * LocalStorageにキャッシュされた位置情報を優先的に使用し、なければGeolocation APIで取得する
 */

import { getFromLocalStorage, saveToLocalStorage } from './helpers.js';

/**
 * ユーザーの現在位置を取得する
 * まずLocalStorageのキャッシュを確認し、なければGeolocation APIを使用して位置情報を取得してキャッシュに保存する
 */
export async function getUserLocation() {
    const cachedLocation = getFromLocalStorage('userLocation');
    if (cachedLocation) {
        console.log('キャッシュされた位置情報を使用:', cachedLocation);
        return cachedLocation;
    }

    if ('geolocation' in navigator) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 600000
                });
            });

            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

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
 * ユーザーに位置情報の許可を求めて現在位置を取得する
 * getUserLocationのエイリアス関数（将来の拡張性のため）
 */
export async function requestUserLocation() {
    return await getUserLocation();
}

/**
 * デフォルト位置（東京駅周辺）を返す
 * 位置情報が取得できない場合のフォールバックとして使用される
 */
export function getDefaultLocation() {
    return { lat: 35.6812, lng: 139.7671 };
}

