import { getStoreById, getLatestFlyerByStoreId, getItemsByFlyerId, updateStoreAddress } from '../services/dataService.js';
import { toValidStoreId } from '../utils/storeHelpers.js';
import { reverseGeocode } from '../services/geocodingService.js';
import { escapeHtml, formatPrice, formatDate, getQueryParamsFromHash } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { getWalkingTime } from '../services/walkingTimeService.js';
import {
    MAX_RETRIES,
    RETRY_DELAY,
    MAP_HEIGHT,
    MAP_ZOOM_DEFAULT,
    MAP_ZOOM_MAX,
    MAP_BOUNDS_PADDING,
    TIMEOUT_LONG,
    TIMEOUT_VERY_LONG,
    TIMEOUT_MEDIUM
} from '../utils/constants.js';

/**
 * 指定された店舗の詳細情報ページのコンテンツを生成する
 */
export async function StoreDetailPage(storeId, userLocation) {
    const validStoreId = toValidStoreId(storeId);
    if (validStoreId == null) {
        return `
            <div class="empty-state">
              <div class="empty-icon">❌</div>
              <p class="empty-text">店舗が見つかりませんでした</p>
              <button id="back-button" class="btn-primary mt-4">ホームに戻る</button>
            </div>
          `;
    }

    const store = await getStoreById(validStoreId);
    const flyer = await getLatestFlyerByStoreId(validStoreId);

    // 店舗が見つからない場合
    if (!store) {
        const templateData = {
            storeNotFound: true,
            hasContent: false
        };
        try {
            return await loadAndRenderTemplate('/templates/pages/store-detail-page.html', templateData);
        } catch (error) {
            return `
            <div class="empty-state">
              <div class="empty-icon">❌</div>
              <p class="empty-text">店舗が見つかりませんでした</p>
              <button id="back-button" class="btn-primary mt-4">ホームに戻る</button>
            </div>
          `;
        }
    }

    // 住所が未設定の場合はNominatimで逆ジオコーディングしてDBに保存する
    let storeAddress = store.address ? store.address.trim() : '';
    if (!storeAddress && store.latitude && store.longitude) {
        try {
            const reversed = await reverseGeocode(store.latitude, store.longitude);
            if (reversed) {
                storeAddress = reversed;

                await updateStoreAddress(storeId, storeAddress);
            }
        } catch (error) {
            console.warn('住所の逆ジオコーディング中にエラーが発生しました:', error);
        }
    }

    // 距離表示は最大6件表示のページのみにするため、ここでは計算しない

    // チラシから商品を取得（最大3件）
    let itemsHTML = '';
    if (flyer) {
        const items = await getItemsByFlyerId(flyer.id);
        const topItems = items
            .sort((a, b) => b.price - a.price) // 価格の高い順
            .slice(0, 3);

        // 商品カードを生成
        const itemPromises = topItems.map(async item => {
            const itemData = {
                itemName: escapeHtml(item.name),
                itemPrice: formatPrice(item.price)
            };
            try {
                return await loadAndRenderTemplate('/templates/components/store-detail-item-card.html', itemData);
            } catch (error) {
                return `
                <div class="item-card">
                  <div class="text-xl font-bold text-gray-800 mb-2">${itemData.itemName}</div>
                  <div class="text-3xl font-bold text-red-600">${itemData.itemPrice}</div>
                </div>
              `;
            }
        });
        itemsHTML = (await Promise.all(itemPromises)).join('');
    }

    const storeName = escapeHtml(store.name);
    const address = escapeHtml(storeAddress || '');
    const station = escapeHtml(store.nearest_station || '');
    const imageUrl = flyer?.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    const updatedAt = flyer ? formatDate(flyer.updated_at) : '-';
    
    // 徒歩時間を取得（データベースに保存されている場合はそれを使用、なければAPIで計算）
    const walkMinutes = await getWalkingTime(validStoreId);
    
    const templateData = {
        storeNotFound: false,
        hasContent: true,
        storeId: storeId,
        storeName: storeName,
        address: address,
        station: station,
        walkMinutes: walkMinutes || null,
        hasWalkMinutes: walkMinutes !== null && walkMinutes !== undefined,
        imageUrl: imageUrl,
        updatedAt: updatedAt,
        hasItems: itemsHTML.length > 0,
        noItems: itemsHTML.length === 0,
        itemsHTML: itemsHTML,
        bestItemName: escapeHtml(store.summary_best_item_name || ''),
        bestItemPrice: formatPrice(store.summary_best_item_price || 0),
        hasStoreLocation: store.latitude && store.longitude,
        storeLat: store.latitude || null,
        storeLng: store.longitude || null,
        userLat: userLocation?.lat || null,
        userLng: userLocation?.lng || null
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/templates/pages/store-detail-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getStoreDetailPageHTMLFallback(storeId, storeName, address, station, walkMinutes, imageUrl, updatedAt, itemsHTML, store.summary_best_item_name, store.summary_best_item_price, store.latitude, store.longitude, userLocation);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getStoreDetailPageHTMLFallback(storeId, storeName, address, station, walkMinutes, imageUrl, updatedAt, itemsHTML, bestItemName, bestItemPrice, storeLat, storeLng, userLocation) {
    return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
      </div>
      <div class="store-detail-card" data-store-id="${storeId}">
        <div class="relative">
          <a 
            href="${imageUrl}" 
            data-lightbox="store-detail-flyer" 
            data-title="${storeName}のチラシ"
            class="block cursor-pointer"
          >
            <img src="${imageUrl}" alt="${storeName}のチラシ" class="w-full h-80 object-cover" />
          </a>
          <div class="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-md">
            <span class="text-sm text-gray-600">更新日: ${updatedAt}</span>
          </div>
        </div>
        <div class="p-8 space-y-6">
          <h1 class="text-4xl font-bold text-gray-800">${storeName}</h1>
          <div class="space-y-3 text-gray-600 text-lg">
            <div class="flex items-start gap-3">
              <span class="text-2xl">📍</span>
              <div><div class="font-medium text-gray-700">住所</div><div>${address}</div></div>
            </div>
            ${station ? `
            <div class="flex items-start gap-3">
              <span class="text-2xl">🚶</span>
              <div><div class="font-medium text-gray-700">最寄り駅</div><div>${station}${walkMinutes ? `から徒歩${walkMinutes}分` : ''}</div></div>
            </div>
            ` : ''}
          </div>
          ${itemsHTML ? `
            <div class="border-t pt-6">
              <h2 class="text-2xl font-bold mb-5 flex items-center gap-2"><span>🏷️</span>本日の目玉商品</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">${itemsHTML}</div>
            </div>
          ` : `
            <div class="border-t pt-6">
              <h2 class="text-2xl font-bold mb-5 flex items-center gap-2"><span>🏷️</span>おすすめ商品</h2>
              <div class="item-highlight">
                <div class="text-xl font-bold text-gray-800 mb-2">${bestItemName}</div>
                <div class="text-3xl font-bold text-red-600">${bestItemPrice}</div>
              </div>
            </div>
          `}
        </div>
      </div>
      ${storeLat && storeLng ? `
      <div class="store-detail-card">
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🗺️</span>
            店舗の位置
          </h2>
          <div id="store-detail-map" class="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200"></div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * 店舗詳細ページに必要なイベントハンドラーを設定する
 * 戻るボタンの初期化を設定する（画像拡大モーダルはmain.jsで初期化済み）
 */
export async function attachStoreDetailPageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }

    // 画像拡大モーダルは既にmain.jsで初期化されているため、ここでは何もしない
    // data-lightbox属性を持つリンクは自動的にモーダルで開く

    // 地図を初期化（DOMのレンダリングを待つ）
    const initStoreMap = async () => {
        // 地図コンテナが見つかるまで待つ
        let mapContainer = null;
        for (let i = 0; i < MAX_RETRIES; i++) {
            mapContainer = document.getElementById('store-detail-map');
            if (mapContainer) break;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
        
        if (!mapContainer) {
            console.error('地図コンテナが見つかりませんでした');
            return;
        }

        try {
            // 店舗の位置情報を取得（data属性から）
            const storeId = document.querySelector('[data-store-id]')?.dataset.storeId;
            if (!storeId) {
                console.warn('店舗IDが見つかりません');
                return;
            }

            const { getStoreById } = await import('../services/dataService.js');
            const store = await getStoreById(storeId);
            
            if (!store || !store.latitude || !store.longitude) {
                console.warn('店舗の位置情報がありません');
                return;
            }

            // URLパラメータから位置情報を取得
            const urlParams = getQueryParamsFromHash();
            const userLat = urlParams.get('lat') ? parseFloat(urlParams.get('lat')) : null;
            const userLng = urlParams.get('lng') ? parseFloat(urlParams.get('lng')) : null;

            // Leafletが読み込まれるまで待つ
            for (let i = 0; i < MAX_RETRIES; i++) {
                if (typeof L !== 'undefined') break;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }

            if (typeof L === 'undefined') {
                console.error('Leafletが読み込まれていません');
                return;
            }

            // 既存の地図インスタンスを削除（直接管理）
            if (window.storeDetailMapInstance) {
                window.storeDetailMapInstance.remove();
                window.storeDetailMapInstance = null;
            }

            // 地図コンテナのサイズを明示的に設定
            mapContainer.style.width = '100%';
            mapContainer.style.height = `${MAP_HEIGHT}px`;
            mapContainer.style.minHeight = `${MAP_HEIGHT}px`;
            mapContainer.style.display = 'block';
            mapContainer.style.position = 'relative';
            
            // 親要素のスタイルも確認・設定
            let parent = mapContainer.parentElement;
            while (parent && parent !== document.body) {
                if (getComputedStyle(parent).display === 'none') {
                    parent.style.display = 'block';
                }
                if (getComputedStyle(parent).width === '0px' || getComputedStyle(parent).width === 'auto') {
                    parent.style.width = '100%';
                }
                parent = parent.parentElement;
            }
            
            // サイズ設定後、少し待ってから地図を初期化
            await new Promise(resolve => setTimeout(resolve, TIMEOUT_LONG));
            
            // 地図を直接初期化
            const map = L.map('store-detail-map').setView([store.latitude, store.longitude], MAP_ZOOM_DEFAULT);
            window.storeDetailMapInstance = map; // グローバルに保存して後で削除できるようにする

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: MAP_ZOOM_MAX
            }).addTo(map);

            // 地図のサイズを再計算（DOMが完全にレンダリングされた後）
            setTimeout(() => {
                map.invalidateSize();
                setTimeout(() => {
                    map.invalidateSize();
                }, TIMEOUT_MEDIUM);
            }, TIMEOUT_LONG);

            // 店舗マーカーを追加
            const storeMarker = L.marker([store.latitude, store.longitude])
                .addTo(map)
                .bindPopup(`<div class="text-center"><strong>${store.name}</strong></div>`);

            // 位置情報がある場合、現在地のマーカーを追加
            if (userLat && userLng) {
                const userMarker = L.marker([userLat, userLng])
                    .addTo(map)
                    .bindPopup('あなたの現在地');

                // 地図の表示範囲を調整（店舗と現在地の両方を含む）
                setTimeout(() => {
                    const bounds = L.latLngBounds(
                        [[store.latitude, store.longitude], [userLat, userLng]]
                    );
                    map.fitBounds(bounds, { padding: [MAP_BOUNDS_PADDING, MAP_BOUNDS_PADDING] });
                    storeMarker.openPopup();
                }, TIMEOUT_VERY_LONG);
            } else {
                // 位置情報がない場合、店舗を中心に表示
                setTimeout(() => {
                    map.setView([store.latitude, store.longitude], MAP_ZOOM_DEFAULT);
                    storeMarker.openPopup();
                }, TIMEOUT_VERY_LONG);
            }
        } catch (error) {
            console.error('地図の初期化エラー:', error);
        }
    };

    // 地図の初期化を開始
    setTimeout(initStoreMap, TIMEOUT_MEDIUM);
}