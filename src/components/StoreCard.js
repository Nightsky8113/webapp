import { escapeHtml, formatPrice } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { getWalkingTime } from '../services/walkingTimeService.js';

/**
 * 店舗情報を表示するカードコンポーネントを生成する
 * 店舗名、チラシ画像、最安商品情報、距離、最寄り駅などの情報を表示する
 * 外部APIから取得した店舗には商品情報がない場合があるため、その場合は表示を調整する
 */
export async function StoreCard(store, flyer, distance) {
    if (!store) return '';

    const storeName = escapeHtml(store.name);
    const itemName = store.summary_best_item_name ? escapeHtml(store.summary_best_item_name) : null;
    const itemPrice = store.summary_best_item_price ? formatPrice(store.summary_best_item_price) : null;
    const thumbnailUrl = flyer?.thumbnail_url || 'https://via.placeholder.com/400x300?text=No+Image';
    const imageUrl = flyer?.image_url || thumbnailUrl;
    const distanceText = distance !== undefined ? `${distance.toFixed(1)} km` : '-';
    const station = escapeHtml(store.nearest_station || '');
    const isFromAPI = store.is_from_api || false;
    
    // 徒歩時間を取得（データベースに保存されている場合はそれを使用、なければAPIで計算）
    const walkMinutes = await getWalkingTime(store.id);

    const templateData = {
        id: store.id,
        storeName: storeName,
        thumbnailUrl: thumbnailUrl,
        imageUrl: imageUrl,
        showDistance: distance !== undefined,
        distanceText: distanceText,
        station: station,
        walkMinutes: walkMinutes || null,
        hasWalkMinutes: walkMinutes !== null && walkMinutes !== undefined,
        itemName: itemName,
        itemPrice: itemPrice,
        hasItemInfo: itemName && itemPrice,
        isFromAPI: isFromAPI,
        address: store.address || ''
    };

    try {
        return await loadAndRenderTemplate('/src/templates/components/store-card.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getStoreCardHTMLFallback(storeName, thumbnailUrl, imageUrl, distanceText, station, walkMinutes, itemName, itemPrice, store.id, distance);
    }
}

/**
 * テンプレート読み込み失敗時に使用するフォールバックHTMLを生成する
 */
function getStoreCardHTMLFallback(storeName, thumbnailUrl, imageUrl, distanceText, station, walkMinutes, itemName, itemPrice, storeId, distance) {
    return `
    <div class="store-card" data-store-id="${storeId}">
      <div class="relative">
        <img 
          src="${thumbnailUrl}" 
          alt="${storeName}のチラシ"
          class="w-full h-48 object-cover cursor-pointer"
          loading="lazy"
        />
        <div class="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
          NEW
        </div>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-xl mb-4 text-gray-800">${storeName}</h3>
        <div class="space-y-3 text-sm text-gray-600 mb-4">
          ${distance !== undefined ? `
          <div class="flex items-center gap-2">
            <span class="text-xl">📍</span>
            <span class="font-medium">現在地から ${distanceText}</span>
          </div>
          ` : ''}
          ${station ? `
          <div class="flex items-center gap-2">
            <span class="text-xl">🚶</span>
            <span>${station}${walkMinutes ? `から徒歩${walkMinutes}分` : ''}</span>
          </div>
          ` : ''}
          <div class="item-highlight">
            <div class="flex items-start gap-2">
              <span class="text-xl">🏷️</span>
              <div class="flex-1">
                <div class="text-gray-700 font-medium text-base mb-1">${itemName}</div>
                <div class="text-red-600 font-bold text-xl">${itemPrice}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 店舗カードのクリックイベントをイベントデリゲーションで設定する
 * 動的に追加されるカードにも対応できるよう、コンテナ要素で一括管理する
 */
export function attachStoreCardEvents(container, onCardClick) {
    if (!container) return;

    container.addEventListener('click', (e) => {
        const card = e.target.closest('[data-store-id]');
        if (card) {
            const storeId = parseInt(card.dataset.storeId);
            if (onCardClick && typeof onCardClick === 'function') {
                onCardClick(storeId);
            }
        }
    });
}