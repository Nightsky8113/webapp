import { getStores, getFlyers } from '../services/dataService.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * 位置情報に基づいて近くの登録店舗一覧ページのコンテンツを生成する
 * stores テーブル（自前管理）のみを表示する
 */
export async function StoresPage(userLocation) {
    const stores = await getStores();
    const flyers = await getFlyers();

    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        const templateData = {
            needsLocation: true,
            hasContent: false
        };
        try {
            return await loadAndRenderTemplate('/src/templates/pages/stores-page.html', templateData);
        } catch (error) {
            return `
            <div class="empty-state">
              <div class="empty-icon">📍</div>
              <p class="empty-text">位置情報が必要です</p>
              <button id="back-button" class="btn-primary mt-4">戻る</button>
            </div>
          `;
        }
    }

    const storesWithDistance = sortByDistance(stores, userLocation).slice(0, 6);

    const storesHTMLPromises = storesWithDistance.map(async (store) => {
        const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
        return await StoreCard(store, flyer, store.distance);
    });
    const storesHTML = (await Promise.all(storesHTMLPromises)).join('');

    const templateData = {
        needsLocation: false,
        hasContent: true,
        storesHTML: storesHTML,
        noStores: storesWithDistance.length === 0,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
        storesCount: storesWithDistance.length
    };

    try {
        return await loadAndRenderTemplate('/src/templates/pages/stores-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getStoresPageHTMLFallback(storesHTML, storesWithDistance.length);
    }
}

function getStoresPageHTMLFallback(storesHTML, storesCount) {
    return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="text-3xl font-bold text-gray-800">近くの店舗（距離順）</h1>
      </div>
      <div class="info-box green">
        <p>登録店舗を現在地から近い順に最大6件表示しています</p>
      </div>
      <div id="stores-map" class="map-container"></div>
      <div id="stores-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${storesHTML}</div>
      ${storesCount === 0 ? `<div class="empty-state"><div class="empty-icon">🏪</div><p class="empty-text">近くに登録店舗がありません</p><p class="text-gray-400 text-sm mt-2"><a href="#/store/register" class="text-blue-600">店舗の方はこちらから登録</a></p></div>` : ''}
    </div>
  `;
}

/**
 * 店舗一覧ページに必要なイベントハンドラーを設定する
 */
export async function attachStoresPageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    const container = document.getElementById('stores-container');
    if (container) {
        attachStoreCardEvents(container, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }

    setTimeout(async () => {
        const mapContainer = document.getElementById('stores-map');
        if (!mapContainer) return;

        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const lat = parseFloat(urlParams.get('lat'));
        const lng = parseFloat(urlParams.get('lng'));

        if (!lat || !lng) return;

        const { initMap, addStoreMarker, clearMarkers, fitBounds } = await import('../utils/map.js');
        const { escapeHtml } = await import('../utils/helpers.js');

        const stores = await getStores();
        const flyers = await getFlyers();
        const userLocation = { lat, lng };

        const storesWithDistance = sortByDistance(stores, userLocation).slice(0, 6);

        initMap('stores-map', lat, lng);
        clearMarkers();

        storesWithDistance.forEach(store => {
            const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
            const storeNameEscaped = escapeHtml(store.name);
            const distanceText = `${store.distance.toFixed(1)} km`;
            const detailButton = `<button onclick="window.location.hash = '/store/${store.id}'" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">詳細を見る</button>`;

            const popupContent = `
                <b>${storeNameEscaped}</b><br>
                📍 ${distanceText}<br>
                ${detailButton}
            `;

            addStoreMarker(store.latitude, store.longitude, store.name, popupContent);
        });

        fitBounds(userLocation);
    }, 100);
}
