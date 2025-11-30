import { getStores, getFlyers } from '../services/dataService.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { searchNearbyStores } from '../services/storeSearchService.js';

/**
 * 位置情報に基づいて近くの店舗一覧ページのコンテンツを生成する
 * データベースの店舗と外部APIから取得した近くのスーパーマーケットを統合し、距離順に最大6件表示する
 */
export async function StoresPage(userLocation) {
    const stores = await getStores();
    const flyers = await getFlyers();

    // 位置情報がない場合はエラー表示
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

    // APIから近くのスーパーマーケットを検索
    let apiStores = [];
    try {
        console.log('近くのスーパーマーケットを検索中...');
        apiStores = await searchNearbyStores(
            userLocation.lat,
            userLocation.lng,
            2000 // 2km以内
        );
        console.log(`${apiStores.length}件のスーパーマーケットが見つかりました`);
    } catch (error) {
        console.error('店舗検索エラー:', error);
        // エラーが発生してもデータベースの店舗は表示する
    }

    // データベースの店舗とAPI検索結果を統合
    // 重複を排除（同じ位置の店舗は除外）
    const allStores = [...stores];
    
    apiStores.forEach(apiStore => {
        const isDuplicate = stores.some(dbStore => {
            // 同じ位置（±100m以内）の店舗は重複とみなす
            const latDiff = Math.abs(dbStore.latitude - apiStore.latitude);
            const lngDiff = Math.abs(dbStore.longitude - apiStore.longitude);
            return latDiff < 0.001 && lngDiff < 0.001;
        });
        
        if (!isDuplicate) {
            // データベースの店舗と形式を統一
            allStores.push({
                ...apiStore,
                // データベースの店舗と互換性を持たせる
                id: apiStore.id || `api_${apiStore.latitude}_${apiStore.longitude}`,
                name: apiStore.name,
                latitude: apiStore.latitude,
                longitude: apiStore.longitude,
                address: apiStore.address || '',
                is_from_api: true
            });
        }
    });

    // 距離順にソート（最大6件）
    const storesWithDistance = sortByDistance(allStores, userLocation).slice(0, 6);

    const storesHTMLPromises = storesWithDistance.map(async store => {
        // APIから取得した店舗にはチラシ情報がない
        const flyer = store.is_from_api ? null : flyers.find(f => f.store_id === store.id && f.is_latest);
        return await StoreCard(store, flyer, store.distance);
    });
    const storesHTML = (await Promise.all(storesHTMLPromises)).join('');

    // テンプレートデータを準備
    const templateData = {
        needsLocation: false,
        hasContent: true,
        storesHTML: storesHTML,
        noStores: storesWithDistance.length === 0,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
        storesCount: storesWithDistance.length
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/stores-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getStoresPageHTMLFallback(storesHTML, storesWithDistance.length);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getStoresPageHTMLFallback(storesHTML, storesCount) {
    return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="text-3xl font-bold text-gray-800">近くの店舗（距離順）</h1>
      </div>
      <div class="info-box green">
        <p>📍 現在地から近い順に最大6件の店舗を表示しています</p>
      </div>
      <div id="stores-map" class="map-container"></div>
      <div id="stores-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${storesHTML}</div>
      ${storesCount === 0 ? `<div class="empty-state"><div class="empty-icon">🏪</div><p class="empty-text">近くに店舗が見つかりませんでした</p></div>` : ''}
    </div>
  `;
}

/**
 * 店舗一覧ページに必要なイベントハンドラーを設定する
 * 戻るボタン、店舗カードのクリックイベント、地図の初期化とマーカー表示を設定する
 * 地図初期化はDOM描画完了を待ってから実行される
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
            // 外部APIから取得した店舗は詳細ページがないため、クリックしても遷移しない
            if (typeof storeId === 'string' && storeId.startsWith('overpass_')) {
                console.log('APIから取得した店舗のため詳細ページはありません');
                return;
            }
            window.location.hash = `/store/${storeId}`;
        });
    }

    // DOM描画完了後に地図を初期化し、店舗マーカーを表示する
    setTimeout(async () => {
        const mapContainer = document.getElementById('stores-map');
        if (mapContainer) {
            // URLパラメータから位置情報を取得
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
            const lat = parseFloat(urlParams.get('lat'));
            const lng = parseFloat(urlParams.get('lng'));

            if (lat && lng) {
                const { initMap, addStoreMarker, clearMarkers, fitBounds } = await import('../utils/map.js');
                const { sortByDistance } = await import('../utils/distance.js');
                const { escapeHtml } = await import('../utils/helpers.js');
                const { searchNearbyStores } = await import('../services/storeSearchService.js');

                // 地図を初期化
                initMap('stores-map', lat, lng);

                // 店舗データを取得（既にインポート済みなので再インポート不要）
                const stores = await getStores();
                const flyers = await getFlyers();
                const userLocation = { lat, lng };

                // APIから近くのスーパーマーケットを検索
                let apiStores = [];
                try {
                    apiStores = await searchNearbyStores(lat, lng, 2000);
                } catch (error) {
                    console.error('地図表示時の店舗検索エラー:', error);
                }

                // データベースの店舗とAPI検索結果を統合
                const allStores = [...stores];
                apiStores.forEach(apiStore => {
                    const isDuplicate = stores.some(dbStore => {
                        const latDiff = Math.abs(dbStore.latitude - apiStore.latitude);
                        const lngDiff = Math.abs(dbStore.longitude - apiStore.longitude);
                        return latDiff < 0.001 && lngDiff < 0.001;
                    });
                    if (!isDuplicate) {
                        allStores.push({
                            ...apiStore,
                            id: apiStore.id || `api_${apiStore.latitude}_${apiStore.longitude}`
                        });
                    }
                });

                const storesWithDistance = sortByDistance(allStores, userLocation).slice(0, 6);

                clearMarkers();

                // 店舗マーカーを追加
                storesWithDistance.forEach(store => {
                    const flyer = store.is_from_api ? null : flyers.find(f => f.store_id === store.id && f.is_latest);
                    const storeNameEscaped = escapeHtml(store.name);
                    const distanceText = `${store.distance.toFixed(1)} km`;
                    
                    // APIから取得した店舗は詳細ページがないので、ボタンを表示しない
                    const detailButton = store.is_from_api 
                        ? '' 
                        : `<button onclick="window.location.hash = '/store/${store.id}'" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                            詳細を見る
                        </button>`;
                    
                    const popupContent = `
                        <b>${storeNameEscaped}</b><br>
                        📍 ${distanceText}<br>
                        ${store.is_from_api ? '<small>（APIから取得した店舗）</small>' : ''}
                        ${detailButton}
                    `;

                    addStoreMarker(store.latitude, store.longitude, store.name, popupContent);
                });

                // すべてのマーカーとユーザー位置を含むように地図の表示範囲を調整
                fitBounds(userLocation);
            }
        }
    }, 100);
}