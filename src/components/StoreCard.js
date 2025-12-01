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
    // プレースホルダー画像の代わりに、データURIを使用（ネットワークエラーを防ぐ）
    const thumbnailUrl = flyer?.thumbnail_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    const imageUrl = flyer?.image_url || thumbnailUrl;
    const distanceText = distance !== undefined ? `${distance.toFixed(1)} km` : '-';
    const station = escapeHtml(store.nearest_station || '');
    const isFromAPI = store.is_from_api || false;
    
    // 徒歩時間を取得（データベースに保存されている場合はそれを使用、なければAPIで計算）
    // 外部APIから取得した店舗はデータベースに存在しないため、徒歩時間を取得しない
    const walkMinutes = isFromAPI ? null : await getWalkingTime(store.id);

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
        return await loadAndRenderTemplate('/templates/components/store-card.html', templateData);
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
            // data-store-id属性から値を取得（文字列として取得される）
            const storeId = card.dataset.storeId;
            if (onCardClick && typeof onCardClick === 'function') {
                // コールバック関数にそのまま渡す（文字列または数値の判定はコールバック側で行う）
                onCardClick(storeId);
            }
        }
    });
}