import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { TIMEOUT_SHORT } from '../utils/constants.js';
import { isExternalStore, navigateToStoreDetail } from '../utils/storeHelpers.js';
import {
    prepareStoresPageData,
    getStoresPageCache,
    findLatestFlyerForStore
} from '../services/nearbyStoresService.js';

/**
 * 位置情報に基づいて近くの店舗一覧ページのコンテンツを生成する
 */
export async function StoresPage(userLocation) {
    if (!userLocation?.lat || !userLocation?.lng) {
        try {
            return await loadAndRenderTemplate('/templates/pages/stores-page.html', {
                needsLocation: true,
                hasContent: false
            });
        } catch {
            return `
            <div class="empty-state">
              <div class="empty-icon">📍</div>
              <p class="empty-text">位置情報が必要です</p>
              <button id="back-button" class="btn-primary mt-4">戻る</button>
            </div>
          `;
        }
    }

    const { storesWithDistance, flyers } = await prepareStoresPageData(userLocation);

    const storesHTML = (
        await Promise.all(
            storesWithDistance.map(async (store) => {
                try {
                    const flyer = findLatestFlyerForStore(flyers, store);
                    return await StoreCard(store, flyer, store.distance, { skipWalkingTime: true });
                } catch (error) {
                    console.error(`店舗カード生成エラー (${store.name}):`, error);
                    return '';
                }
            })
        )
    ).join('');

    const templateData = {
        needsLocation: false,
        hasContent: true,
        storesHTML,
        noStores: storesWithDistance.length === 0,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
        storesCount: storesWithDistance.length
    };

    try {
        return await loadAndRenderTemplate('/templates/pages/stores-page.html', templateData);
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
        <p>現在地から近い順に最大6件の店舗を表示しています</p>
      </div>
      <div id="stores-map" class="map-container"></div>
      <div id="stores-container" class="stores-grid">${storesHTML}</div>
      ${storesCount === 0 ? `<div class="empty-state"><div class="empty-icon">🏪</div><p class="empty-text">近くに店舗が見つかりませんでした</p><p class="text-gray-400 text-sm mt-2"><a href="#/store/register" class="text-blue-600">店舗の方はこちらから登録</a></p></div>` : ''}
    </div>
  `;
}

export async function attachStoresPageEvents() {
    document.getElementById('back-button')?.addEventListener('click', () => {
        window.location.hash = '/home';
    });

    attachStoreCardEventsWhenReady();
    initStoresMapWhenReady();
}

function attachStoreCardEventsWhenReady(retryCount = 0) {
    const container = document.getElementById('stores-container');
    if (container) {
        attachStoreCardEvents(container, navigateToStoreDetail);
        return;
    }
    if (retryCount < 10) {
        setTimeout(() => attachStoreCardEventsWhenReady(retryCount + 1), 200);
    }
}

function initStoresMapWhenReady() {
    setTimeout(async () => {
        const mapContainer = document.getElementById('stores-map');
        const cache = getStoresPageCache();
        if (!mapContainer || !cache) return;

        const { storesWithDistance, userLocation } = cache;
        const { lat, lng } = userLocation;
        if (!lat || !lng) return;

        const { initMap, addStoreMarker, clearMarkers, fitBounds } = await import('../utils/map.js');
        const { escapeHtml } = await import('../utils/helpers.js');

        initMap('stores-map', lat, lng);
        clearMarkers();

        for (const store of storesWithDistance) {
            const name = escapeHtml(store.name);
            const distanceText = `${store.distance.toFixed(1)} km`;
            const detailButton = isExternalStore(store)
                ? ''
                : `<button data-store-id="${store.id}" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">詳細を見る</button>`;

            addStoreMarker(store.latitude, store.longitude, store.name, `
                <b>${name}</b><br>
                📍 ${distanceText}<br>
                ${isExternalStore(store) ? '<small>（地図データのみ）</small>' : ''}
                ${detailButton}
            `);
        }

        fitBounds(userLocation);
    }, TIMEOUT_SHORT);
}
