import { escapeHtml, formatPrice } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { getWalkingTime } from '../services/walkingTimeService.js';
import { isExternalStore, toValidStoreId } from '../utils/storeHelpers.js';
import { MAX_WALKING_TIME_TIMEOUT } from '../utils/constants.js';

/**
 * 店舗情報を表示するカードコンポーネントを生成する
 * 店舗名、チラシ画像、最安商品情報、距離、最寄り駅などの情報を表示する
 * 外部APIから取得した店舗には商品情報がない場合があるため、その場合は表示を調整する
 */
export async function StoreCard(store, flyer, distance, options = {}) {
    if (!store) return '';

    const { skipWalkingTime = false } = options;

    const storeName = escapeHtml(store.name);
    // null値や空文字列の場合は空文字列にする（「null」という文字列が表示されるのを防ぐ）
    const itemName = store.summary_best_item_name && store.summary_best_item_name !== 'null' 
        ? escapeHtml(store.summary_best_item_name) 
        : '';
    const itemPrice = store.summary_best_item_price && store.summary_best_item_price !== null && store.summary_best_item_price !== 'null'
        ? formatPrice(store.summary_best_item_price) 
        : '';
    // プレースホルダー画像の代わりに、データURIを使用（ネットワークエラーを防ぐ）
    const thumbnailUrl = flyer?.thumbnail_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    const imageUrl = flyer?.image_url || thumbnailUrl;
    const distanceText = distance !== undefined ? `${distance.toFixed(1)} km` : '-';
    const station = escapeHtml(store.nearest_station || '');
    const isFromAPI = isExternalStore(store);

    let walkMinutes = null;
    if (!skipWalkingTime && !isFromAPI && toValidStoreId(store.id) != null) {
        try {
            walkMinutes = await Promise.race([
                getWalkingTime(store.id),
                new Promise((resolve) => setTimeout(() => resolve(null), MAX_WALKING_TIME_TIMEOUT))
            ]);
        } catch (error) {
            console.warn(`店舗 ${store.id} の徒歩時間取得エラー:`, error);
        }
    }

    const templateData = {
        id: String(store.id), // テンプレートで確実に文字列として扱われるようにする
        storeName: storeName,
        thumbnailUrl: thumbnailUrl,
        imageUrl: imageUrl,
        showDistance: distance !== undefined,
        distanceText: distanceText,
        station: station,
        walkMinutes: walkMinutes || null,
        hasWalkMinutes: walkMinutes !== null && walkMinutes !== undefined,
        itemName: itemName || '', // nullの場合は空文字列にする
        itemPrice: itemPrice || '', // nullの場合は空文字列にする
        hasItemInfo: itemName && itemPrice && itemName.trim() !== '' && itemPrice.trim() !== '', // null値または空文字列のチェック
        isFromAPI: isFromAPI,
        address: store.address || ''
    };

    try {
        const renderedHTML = await loadAndRenderTemplate('/templates/components/store-card.html', templateData);
        // テンプレートタグが残っている場合は、フォールバックを使用
        if (renderedHTML.includes('${if:') || renderedHTML.includes('${endif}')) {
            return getStoreCardHTMLFallback(storeName, thumbnailUrl, imageUrl, distanceText, station, walkMinutes, itemName, itemPrice, store.id, distance);
        }
        return renderedHTML;
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
          ${itemName && itemPrice ? `
          <div class="item-highlight">
            <div class="flex items-start gap-2">
              <span class="text-xl">🏷️</span>
              <div class="flex-1">
                <div class="text-gray-700 font-medium text-base mb-1">${itemName}</div>
                <div class="text-red-600 font-bold text-xl">${itemPrice}</div>
              </div>
            </div>
          </div>
          ` : ''}
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
    if (!container) {
        console.error('attachStoreCardEvents: コンテナが見つかりません');
        return;
    }

    // 既存のイベントリスナーを削除（重複を防ぐ）
    const existingHandler = container._storeCardClickHandler;
    if (existingHandler) {
        container.removeEventListener('click', existingHandler);
    }

    // 新しいイベントハンドラーを作成
    const clickHandler = (e) => {
        // クリックされた要素から親方向に向かって、.store-cardクラスを持つ要素を検索
        const card = e.target.closest('.store-card');
        
        if (card && card.dataset.storeId) {
            // data-store-id属性から値を取得（文字列として取得される）
            const storeId = card.dataset.storeId;
            if (onCardClick && typeof onCardClick === 'function') {
                // コールバック関数にそのまま渡す（文字列または数値の判定はコールバック側で行う）
                e.stopPropagation(); // イベントの伝播を停止
                onCardClick(storeId);
            }
        }
    };
    
    // イベントハンドラーを保存（後で削除できるように）
    container._storeCardClickHandler = clickHandler;
    container.addEventListener('click', clickHandler);
}