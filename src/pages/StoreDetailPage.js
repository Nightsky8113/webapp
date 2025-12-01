import { getStoreById, getLatestFlyerByStoreId, getItemsByFlyerId } from '../services/dataService.js';
import { calculateDistance } from '../utils/distance.js';
import { escapeHtml, formatPrice, formatDate } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { getWalkingTime } from '../services/walkingTimeService.js';

/**
 * 指定された店舗の詳細情報ページのコンテンツを生成する
 * 店舗情報、最新チラシ画像、商品情報、距離、お気に入り機能などを表示する
 */
export async function StoreDetailPage(storeId, userLocation) {
    const store = await getStoreById(storeId);
    const flyer = await getLatestFlyerByStoreId(storeId);

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

    // 位置情報がない場合の処理
    let distance = 0;
    if (userLocation && userLocation.lat && userLocation.lng) {
        distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            store.latitude,
            store.longitude
        );
    }

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
    const address = escapeHtml(store.address || '');
    const station = escapeHtml(store.nearest_station || '');
    const imageUrl = flyer?.image_url || 'https://via.placeholder.com/800x600?text=No+Image';
    const updatedAt = flyer ? formatDate(flyer.updated_at) : '-';
    
    // 徒歩時間を取得（データベースに保存されている場合はそれを使用、なければAPIで計算）
    const walkMinutes = await getWalkingTime(storeId);
    
    // 距離表示用テキスト（距離が計算されていない場合は「-」のみ、計算されている場合は「X.X km」）
    const distanceText = distance > 0 ? `${distance.toFixed(1)} km` : '-';

    const templateData = {
        storeNotFound: false,
        hasContent: true,
        storeId: storeId,
        storeName: storeName,
        address: address,
        distanceText: distanceText,
        station: station,
        walkMinutes: walkMinutes || null,
        hasWalkMinutes: walkMinutes !== null && walkMinutes !== undefined,
        imageUrl: imageUrl,
        updatedAt: updatedAt,
        hasItems: itemsHTML.length > 0,
        noItems: itemsHTML.length === 0,
        itemsHTML: itemsHTML,
        bestItemName: escapeHtml(store.summary_best_item_name || ''),
        bestItemPrice: formatPrice(store.summary_best_item_price || 0)
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/templates/pages/store-detail-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        const distanceText = distance > 0 ? `${distance.toFixed(1)} km` : '-';
        return getStoreDetailPageHTMLFallback(storeId, storeName, address, distanceText, station, walkMinutes, imageUrl, updatedAt, itemsHTML, store.summary_best_item_name, store.summary_best_item_price);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getStoreDetailPageHTMLFallback(storeId, storeName, address, distanceText, station, walkMinutes, imageUrl, updatedAt, itemsHTML, bestItemName, bestItemPrice) {
    return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
      </div>
      <div class="store-detail-card">
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
            <div class="flex items-start gap-3">
              <span class="text-2xl">📏</span>
              <div><div class="font-medium text-gray-700">現在地からの距離</div><div>${distanceText}</div></div>
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
    </div>
  `;
}

/**
 * 店舗詳細ページに必要なイベントハンドラーを設定する
 * 戻るボタンの初期化を設定する（画像拡大モーダルはmain.jsで初期化済み）
 */
export function attachStoreDetailPageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }

    // 画像拡大モーダルは既にmain.jsで初期化されているため、ここでは何もしない
    // data-lightbox属性を持つリンクは自動的にモーダルで開く
}