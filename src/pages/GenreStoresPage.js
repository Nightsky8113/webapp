import { getStoresByGenreId, getGenreById, getFlyers, getItemsByGenreId } from '../services/dataService.js';
import { filterByDistance, sortByDistance } from '../utils/distance.js';
import { escapeHtml, formatPrice } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { initMap, addStoreMarker, clearMarkers, fitBounds } from '../utils/map.js';

/**
 * 指定されたジャンルの商品を取り扱う店舗一覧ページのコンテンツを生成する
 * ユーザー位置から5km以内の店舗を抽出し、各店舗で最も安い商品情報と距離を表示する
 */
export async function GenreStoresPage(genreId, userLocation) {
    const genre = await getGenreById(genreId);
    const stores = await getStoresByGenreId(genreId);
    const flyers = await getFlyers();

    // ジャンルが見つからない場合
    if (!genre) {
        const templateData = {
            genreNotFound: true,
            needsLocation: false,
            hasContent: false
        };
        try {
            return await loadAndRenderTemplate('/src/templates/pages/genre-stores-page.html', templateData);
        } catch (error) {
            return `
            <div class="empty-state">
              <div class="empty-icon">❌</div>
              <p class="empty-text">ジャンルが見つかりませんでした</p>
              <button id="back-button" class="btn-primary mt-4">ホームに戻る</button>
            </div>
          `;
        }
    }

    // 位置情報がない場合はエラー表示
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        const templateData = {
            genreNotFound: false,
            needsLocation: true,
            hasContent: false
        };
        try {
            return await loadAndRenderTemplate('/src/templates/pages/genre-stores-page.html', templateData);
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

    // 5km以内にフィルタリング & 距離順ソート
    const nearbyStores = filterByDistance(stores, userLocation, 5);
    const storesWithDistance = sortByDistance(nearbyStores, userLocation);

    // ジャンルの商品を取得（店舗ごとの商品情報を取得するため）
    const genreItems = await getItemsByGenreId(genreId);

    // 店舗リストのHTML生成（サンプルのようにシンプルに）
    const storesHTMLPromises = storesWithDistance.map(async store => {
        // この店舗のチラシIDを取得
        const storeFlyer = flyers.find(f => f.store_id === store.id && f.is_latest);
        if (!storeFlyer) return '';

        // この店舗のチラシの商品で、該当ジャンルの商品を取得
        const storeItems = genreItems.filter(item => item.flyer_id === storeFlyer.id);
        if (storeItems.length === 0) return '';

        // 最も安い商品を取得
        const cheapestItem = storeItems.reduce((prev, curr) => 
            prev.price < curr.price ? prev : curr
        );

        const storeName = escapeHtml(store.name);
        const itemName = escapeHtml(cheapestItem.name);
        const itemPrice = formatPrice(cheapestItem.price);
        const distanceText = `${Math.floor(store.distance * 1000)}m`;

        const itemData = {
            storeId: store.id,
            storeName: storeName,
            itemName: itemName,
            itemPrice: itemPrice,
            distanceText: distanceText
        };

        try {
            return await loadAndRenderTemplate('/src/templates/components/genre-store-item.html', itemData);
        } catch (error) {
            return `
            <li class="genre-store-item" data-store-id="${store.id}">
              <div class="store-item-content">
                <div class="store-item-info">
                  <div class="store-item-name"><b>${storeName}</b></div>
                  <div class="store-item-product">${itemName} → <b>${itemPrice}</b></div>
                  <div class="store-item-distance">距離：${distanceText}</div>
                </div>
              </div>
            </li>
          `;
        }
    });

    const storesHTML = (await Promise.all(storesHTMLPromises)).filter(html => html).join('');

    const genreName = escapeHtml(genre.name);
    const icon = genre.icon || '📦';

    // テンプレートデータを準備
    const templateData = {
        genreNotFound: false,
        needsLocation: false,
        hasContent: true,
        genreName: genreName,
        genreIcon: icon,
        storesHTML: storesHTML,
        storesCount: storesWithDistance.length,
        noStores: storesWithDistance.length === 0,
        userLat: userLocation.lat,
        userLng: userLocation.lng
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/genre-stores-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getGenreStoresPageHTMLFallback(genreName, icon, storesHTML, storesWithDistance.length);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getGenreStoresPageHTMLFallback(genreName, icon, storesHTML, storesCount) {
    return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span class="text-4xl">${icon}</span>${genreName}を扱う店舗
        </h1>
      </div>
      <div class="info-box blue">
        <p>📍 現在地から5km以内の店舗を距離順に表示しています（${storesCount}件）</p>
      </div>
      <div id="stores-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${storesHTML}</div>
      ${storesCount === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p class="empty-text">近くに該当する店舗が見つかりませんでした</p>
          <p class="text-gray-400 text-sm mt-2">範囲を広げるか、別のジャンルをお試しください</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * ジャンル別店舗一覧ページに必要なイベントハンドラーを設定する
 * 戻るボタン、地図の初期化とマーカー表示、店舗リストのクリックイベントを設定する
 */
export async function attachGenreStoresPageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    const mapContainer = document.getElementById('genre-stores-map');
    if (mapContainer) {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const lat = parseFloat(urlParams.get('lat'));
        const lng = parseFloat(urlParams.get('lng'));

        if (lat && lng) {
            initMap('genre-stores-map', lat, lng);

            const { getStoresByGenreId, getFlyers, getItemsByGenreId } = await import('../services/dataService.js');
            const { filterByDistance, sortByDistance } = await import('../utils/distance.js');
            const { formatPrice } = await import('../utils/helpers.js');

            const hash = window.location.hash;
            const genreIdMatch = hash.match(/\/genre\/(\d+)\/stores/);
            if (genreIdMatch) {
                const genreId = parseInt(genreIdMatch[1]);
                const stores = await getStoresByGenreId(genreId);
                const flyers = await getFlyers();
                const items = await getItemsByGenreId(genreId);

                const userLocation = { lat, lng };
                const nearbyStores = filterByDistance(stores, userLocation, 5);
                const storesWithDistance = sortByDistance(nearbyStores, userLocation);

                clearMarkers();

                storesWithDistance.forEach(store => {
                    const storeFlyer = flyers.find(f => f.store_id === store.id && f.is_latest);
                    if (!storeFlyer) return;

                    const storeItems = items.filter(item => item.flyer_id === storeFlyer.id);
                    if (storeItems.length === 0) return;

                    const cheapestItem = storeItems.reduce((prev, curr) => 
                        prev.price < curr.price ? prev : curr
                    );

                    const storeNameEscaped = escapeHtml(store.name);
                    const itemNameEscaped = escapeHtml(cheapestItem.name);
                    const popupContent = `
                        <b>${storeNameEscaped}</b><br>
                        ${itemNameEscaped} → ${formatPrice(cheapestItem.price)}<br>
                        ${Math.floor(store.distance * 1000)}m
                    `;

                    addStoreMarker(store.latitude, store.longitude, store.name, popupContent);
                });

                fitBounds();
            }
        }
    }

    const storesList = document.getElementById('stores-list');
    if (storesList) {
        storesList.addEventListener('click', (e) => {
            const storeItem = e.target.closest('.genre-store-item');
            if (storeItem) {
                const storeId = parseInt(storeItem.dataset.storeId);
                window.location.hash = `/store/${storeId}`;
            }
        });
    }
}