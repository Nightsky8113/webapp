import { escapeHtml, formatPrice } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * 店舗カードコンポーネント（分離版）
 * HTMLは外部テンプレート、CSSはカスタムクラスを使用
 * 
 * @param {Object} store - 店舗データ
 * @param {Object} flyer - チラシデータ
 * @param {number} distance - 現在地からの距離（km）
 * @returns {Promise<string>} HTML文字列
 */
export async function StoreCard(store, flyer, distance) {
    if (!store) return '';

    const storeName = escapeHtml(store.name);
    const itemName = escapeHtml(store.summary_best_item_name);
    const itemPrice = formatPrice(store.summary_best_item_price);
    const thumbnailUrl = flyer?.thumbnail_url || 'https://via.placeholder.com/400x300?text=No+Image';
    const imageUrl = flyer?.image_url || thumbnailUrl; // 拡大表示用の元画像URL
    const distanceText = distance !== undefined ? `${distance.toFixed(1)} km` : '-';
    const walkMinutes = store.summary_walk_minutes || '-';
    const station = escapeHtml(store.nearest_station || '');

    // テンプレートデータを準備
    const templateData = {
        id: store.id,
        storeName: storeName,
        thumbnailUrl: thumbnailUrl,
        imageUrl: imageUrl, // Lightbox用
        showDistance: distance !== undefined,
        distanceText: distanceText,
        station: station,
        walkMinutes: walkMinutes,
        itemName: itemName,
        itemPrice: itemPrice
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/components/store-card.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        // フォールバック: インラインHTML（既存の方法）
        return getStoreCardHTMLFallback(storeName, thumbnailUrl, imageUrl, distanceText, station, walkMinutes, itemName, itemPrice, store.id, distance);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
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
          <div class="flex items-center gap-2">
            <span class="text-xl">🚶</span>
            <span>${station}から徒歩${walkMinutes}分</span>
          </div>
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