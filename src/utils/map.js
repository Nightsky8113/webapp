/**
 * Leafletを使用した地図表示機能を提供するユーティリティ
 * 地図の初期化、マーカーの追加・削除、表示範囲の調整などの機能を管理する
 */

let mapInstance = null;
let markers = [];

/**
 * Leafletライブラリが読み込まれているかどうかを確認する
 */
function isLeafletLoaded() {
    return typeof L !== 'undefined';
}

/**
 * 指定された位置を中心にLeaflet地図を初期化する
 * 既存の地図インスタンスがある場合は削除してから新しい地図を作成する
 * OpenStreetMapのタイルレイヤーを使用し、ユーザーの現在地にマーカーを表示する
 */
export function initMap(containerId, lat, lng, zoom = 15) {
    if (!isLeafletLoaded()) {
        console.error('Leafletが読み込まれていません。index.htmlにLeafletのCDNを追加してください。');
        return null;
    }

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
        markers = [];
    }

    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
        console.error(`地図コンテナが見つかりません: ${containerId}`);
        return null;
    }

    mapInstance = L.map(containerId).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapInstance);

    L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup('あなたの現在地')
        .openPopup();

    return mapInstance;
}

/**
 * 地図上に店舗マーカーを追加する
 * マーカーをクリックするとポップアップで店舗情報を表示する
 * popupContentにボタンが含まれる場合、data-store-id属性を使用してイベントリスナーを設定する
 */
export function addStoreMarker(lat, lng, storeName, popupContent) {
    if (!mapInstance) {
        console.error('地図が初期化されていません');
        return null;
    }

    const marker = L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup(popupContent)
        .on('popupopen', () => {
            // ポップアップが開いたときに、ボタンにイベントリスナーを追加
            const popup = marker.getPopup();
            if (popup) {
                const popupElement = popup.getElement();
                if (popupElement) {
                    const storeButton = popupElement.querySelector('[data-store-id]');
                    if (storeButton) {
                        const storeId = storeButton.getAttribute('data-store-id');
                        if (storeId) {
                            // 既存のイベントリスナーを削除してから追加（重複を防ぐ）
                            const newButton = storeButton.cloneNode(true);
                            storeButton.parentNode.replaceChild(newButton, storeButton);
                            newButton.addEventListener('click', () => {
                                window.location.hash = `/store/${storeId}`;
                            });
                        }
                    }
                }
            }
        });

    markers.push(marker);
    return marker;
}

/**
 * 地図上のすべてのマーカーを削除する
 * 新しい店舗リストを表示する前に呼び出してクリアする
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
 * 地図の表示範囲を、すべてのマーカーとユーザー位置を含むように自動調整する
 * すべての店舗と現在地が1画面に収まるようにズームレベルを調整する
 */
export function fitBounds(userLocation = null) {
    if (!mapInstance) {
        return;
    }

    const bounds = L.latLngBounds();
    
    markers.forEach(marker => {
        bounds.extend(marker.getLatLng());
    });
    
    if (userLocation && userLocation.lat && userLocation.lng) {
        bounds.extend([userLocation.lat, userLocation.lng]);
    } else {
        if (mapInstance) {
            mapInstance.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getPopup) {
                    const popup = layer.getPopup();
                    if (popup && popup.getContent() === "あなたの現在地") {
                        bounds.extend(layer.getLatLng());
                    }
                }
            });
        }
    }

    if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
}

/**
 * 地図インスタンスを完全に削除し、メモリを解放する
 * ページ遷移時など、地図が不要になった際に呼び出す
 */
export function removeMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    markers = [];
}

