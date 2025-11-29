import { escapeHtml, formatPrice } from '../utils/helpers.js';

/**
 * 店舗カードコンポーネント
 * @param {Object} store - 店舗データ
 * @param {Object} flyer - チラシデータ
 * @param {number} distance - 現在地からの距離（km）
 * @returns {string} HTML文字列
 */
export function StoreCard(store, flyer, distance) {
    if (!store) return '';

    const storeName = escapeHtml(store.name);
    const itemName = escapeHtml(store.summary_best_item_name);
    const itemPrice = formatPrice(store.summary_best_item_price);
    const thumbnailUrl = flyer?.thumbnail_url || 'https://via.placeholder.com/400x300?text=No+Image';
    const distanceText = distance !== undefined ? `${distance.toFixed(1)} km` : '-';
    const walkMinutes = store.summary_walk_minutes || '-';
    const station = escapeHtml(store.nearest_station || '');

    return `
    <div class="card-hover" data-store-id="${store.id}">
      <!-- チラシサムネイル -->
      <div class="relative">
        <img 
          src="${thumbnailUrl}" 
          alt="${storeName}のチラシ"
          class="w-full h-48 object-cover"
          loading="lazy"
        />
        <div class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          NEW
        </div>
      </div>
      
      <!-- カード本体 -->
      <div class="p-4">
        <h3 class="font-bold text-lg mb-3 text-gray-800">${storeName}</h3>
        
        <div class="space-y-2 text-sm text-gray-600">
          <!-- 距離 -->
          <div class="flex items-center gap-2">
            <span class="text-lg">📍</span>
            <span>現在地から ${distanceText}</span>
          </div>
          
          <!-- 最寄り駅 -->
          <div class="flex items-center gap-2">
            <span class="text-lg">🚶</span>
            <span>${station}から徒歩${walkMinutes}分</span>
          </div>
          
          <!-- おすすめ商品 -->
          <div class="flex items-center gap-2 mt-3 pt-3 border-t">
            <span class="text-lg">🏷️</span>
            <div class="flex-1">
              <div class="text-gray-700 font-medium">${itemName}</div>
              <div class="text-red-600 font-bold text-lg">${itemPrice}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 店舗カードのクリックイベントを設定
 * @param {HTMLElement} container - コンテナ要素
 * @param {Function} onCardClick - クリック時のコールバック
 */
export function attachStoreCardEvents(container, onCardClick) {
    if (!container) return;

    // イベントデリゲーション: 親要素で一括管理
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