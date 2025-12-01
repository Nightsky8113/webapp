import { getStores, getFlyers, addStoreIfNotExists } from '../services/dataService.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { searchNearbyStores } from '../services/storeSearchService.js';

/**
 * データベースの店舗とAPIから取得した店舗を統合する共通関数
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @param {Array} dbStores - データベースから取得した店舗リスト
 * @param {Array} apiStores - APIから取得した店舗リスト
 * @returns {Promise<Array>} 統合された店舗リスト（距離順にソート済み、最大6件）
 */
async function mergeStoresFromDBAndAPI(userLocation, dbStores, apiStores) {
    // APIから取得した店舗をデータベースに追加（存在しない場合のみ）
    for (const apiStore of apiStores) {
        try {
            await addStoreIfNotExists({
                name: apiStore.name,
                latitude: apiStore.latitude,
                longitude: apiStore.longitude,
                address: apiStore.address || ''
            });
        } catch (error) {
            // 店舗追加に失敗しても続行（APIから取得した店舗として表示する）
            console.warn('店舗追加エラー:', error);
        }
    }

    // データベースの店舗を再取得（追加された店舗を含む）
    const updatedDbStores = await getStores(true);

    // APIから取得した店舗のうち、DBに追加されなかったものも含める
    const allStores = [...updatedDbStores];
    
    // 店舗の重複判定用の距離閾値（約100m、dataService.jsと同じ値）
    const STORE_DUPLICATE_THRESHOLD = 0.001;
    
    apiStores.forEach(apiStore => {
        const isInDb = updatedDbStores.some(dbStore => {
            const latDiff = Math.abs(dbStore.latitude - apiStore.latitude);
            const lngDiff = Math.abs(dbStore.longitude - apiStore.longitude);
            return latDiff < STORE_DUPLICATE_THRESHOLD && lngDiff < STORE_DUPLICATE_THRESHOLD;
        });
        
        if (!isInDb) {
            allStores.push({
                ...apiStore,
                id: apiStore.id || `api_${apiStore.latitude}_${apiStore.longitude}`
            });
        }
    });

    // 距離順にソート（最大6件）
    return sortByDistance(allStores, userLocation).slice(0, 6);
}

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
            return await loadAndRenderTemplate('/templates/pages/stores-page.html', templateData);
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
        apiStores = await searchNearbyStores(
            userLocation.lat,
            userLocation.lng,
            2000 // 2km以内
        );
    } catch (error) {
        console.error('店舗検索エラー:', error);
        // エラーが発生してもデータベースの店舗は表示する
    }

    // データベースの店舗とAPIから取得した店舗を統合
    const storesWithDistance = await mergeStoresFromDBAndAPI(userLocation, stores, apiStores);

    const storesHTMLPromises = storesWithDistance.map(async (store) => {
        // APIから取得した店舗（is_from_apiフラグがある、またはIDが文字列でoverpass_で始まる）にはチラシ情報がない
        const isFromAPI = store.is_from_api || (typeof store.id === 'string' && (store.id.startsWith('overpass_') || store.id.startsWith('api_')));
        const flyer = isFromAPI ? null : flyers.find(f => f.store_id === store.id && f.is_latest);
        
        try {
            return await StoreCard(store, flyer, store.distance);
        } catch (error) {
            console.error(`店舗カード生成エラー (${store.name}):`, error);
            return '';
        }
    });
    
    const storesHTMLResults = await Promise.all(storesHTMLPromises);
    const storesHTML = storesHTMLResults.join('');

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
        return await loadAndRenderTemplate('/templates/pages/stores-page.html', templateData);
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

    // DOM描画完了を待ってから店舗カードのクリックイベントを設定
    // 複数回試行して、DOMが完全にレンダリングされるまで待つ
    let retryCount = 0;
    const maxRetries = 10;
    const checkAndAttachEvents = () => {
        const container = document.getElementById('stores-container');
        if (container) {
            attachStoreCardEvents(container, (storeId) => {
                // storeIdは文字列として取得される（data-store-id属性から）
                const storeIdStr = String(storeId);
                
                // 外部APIから取得した店舗（文字列IDでoverpass_またはapi_で始まる）は詳細ページがないため、クリックしても遷移しない
                if (storeIdStr.startsWith('overpass_') || storeIdStr.startsWith('api_')) {
                    return;
                }
                
                // 数値IDの場合のみ詳細ページに遷移
                const numericId = parseInt(storeIdStr, 10);
                if (!isNaN(numericId) && numericId > 0) {
                    // URLから位置情報を取得して店舗詳細ページのURLに含める
                    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
                    const lat = urlParams.get('lat');
                    const lng = urlParams.get('lng');
                    
                    if (lat && lng) {
                        window.location.hash = `/store/${numericId}?lat=${lat}&lng=${lng}`;
                    } else {
                        window.location.hash = `/store/${numericId}`;
                    }
                }
            });
        } else {
            console.error('stores-containerが見つかりません');
            // リトライ
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(checkAndAttachEvents, 200);
            }
        }
    };
    
    // 初回実行
    setTimeout(checkAndAttachEvents, 100);

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
                const { escapeHtml } = await import('../utils/helpers.js');
                const { searchNearbyStores } = await import('../services/storeSearchService.js');

                // 地図を初期化
                initMap('stores-map', lat, lng);

                // 店舗データを取得
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

                // データベースの店舗とAPI検索結果を統合（共通関数を使用）
                const storesWithDistance = await mergeStoresFromDBAndAPI(userLocation, stores, apiStores);

                clearMarkers();

                // 店舗マーカーを追加
                storesWithDistance.forEach(store => {
                    const flyer = store.is_from_api ? null : flyers.find(f => f.store_id === store.id && f.is_latest);
                    const storeNameEscaped = escapeHtml(store.name);
                    const distanceText = `${store.distance.toFixed(1)} km`;
                    
                    // APIから取得した店舗は詳細ページがないので、ボタンを表示しない
                    const detailButton = store.is_from_api 
                        ? '' 
                        : `<button data-store-id="${store.id}" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
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