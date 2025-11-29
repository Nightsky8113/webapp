/**
 * 地図表示ユーティリティ
 * Leafletを使用して地図を表示
 */

let mapInstance = null;
let markers = [];

/**
 * Leafletが読み込まれているか確認
 */
function isLeafletLoaded() {
    return typeof L !== 'undefined';
}

/**
 * 地図を初期化
 * @param {string} containerId - 地図を表示するコンテナのID
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @param {number} zoom - ズームレベル
 */
export function initMap(containerId, lat, lng, zoom = 15) {
    if (!isLeafletLoaded()) {
        console.error('Leafletが読み込まれていません。index.htmlにLeafletのCDNを追加してください。');
        return null;
    }

    // 既存の地図を削除
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
        markers = [];
    }

    // 地図を初期化
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
        console.error(`地図コンテナが見つかりません: ${containerId}`);
        return null;
    }

    mapInstance = L.map(containerId).setView([lat, lng], zoom);

    // タイルレイヤーを追加
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapInstance);

    // 現在地マーカーを追加
    L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup('あなたの現在地')
        .openPopup();

    return mapInstance;
}

/**
 * 店舗マーカーを追加
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @param {string} storeName - 店舗名
 * @param {string} popupContent - ポップアップの内容
 */
export function addStoreMarker(lat, lng, storeName, popupContent) {
    if (!mapInstance) {
        console.error('地図が初期化されていません');
        return null;
    }

    const marker = L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup(popupContent);

    markers.push(marker);
    return marker;
}

/**
 * すべてのマーカーを削除
 */
export function clearMarkers() {
    markers.forEach(marker => {
        if (mapInstance) {
            mapInstance.removeLayer(marker);
        }
    });
    markers = [];
}

/**
 * 地図の表示範囲を調整（すべてのマーカーを含む）
 */
export function fitBounds() {
    if (!mapInstance || markers.length === 0) {
        return;
    }

    const bounds = L.latLngBounds(
        markers.map(marker => marker.getLatLng())
    );
    mapInstance.fitBounds(bounds, { padding: [50, 50] });
}

/**
 * 地図を削除
 */
export function removeMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    markers = [];
}

