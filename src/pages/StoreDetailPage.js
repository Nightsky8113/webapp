import { getStoreById, getLatestFlyerByStoreId, getItemsByFlyerId } from '../services/dataService.js';
import { calculateDistance } from '../utils/distance.js';
import { escapeHtml, formatPrice, formatDate } from '../utils/helpers.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * 店舗詳細ページを描画（分離版）
 * HTMLは外部テンプレート、CSSはカスタムクラスを使用
 * 
 * @param {number} storeId - 店舗ID
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @returns {Promise<string>} HTML文字列
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
            return await loadAndRenderTemplate('/src/templates/pages/store-detail-page.html', templateData);
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

    const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        store.latitude,
        store.longitude
    );

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
                return await loadAndRenderTemplate('/src/templates/components/store-detail-item-card.html', itemData);
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
    const address = escapeHtml(store.address);
    const station = escapeHtml(store.nearest_station);
    const imageUrl = flyer?.image_url || 'https://via.placeholder.com/800x600?text=No+Image';
    const updatedAt = flyer ? formatDate(flyer.updated_at) : '-';
    const isFav = isFavorite(storeId);

    // テンプレートデータを準備
    const favoriteClass = isFav ? 'active' : 'inactive';
    const favoriteIcon = isFav ? '❤️' : '🤍';
    const favoriteText = isFav ? 'お気に入り済み' : 'お気に入りに追加';
    
    const templateData = {
        storeNotFound: false,
        hasContent: true,
        storeId: storeId,
        storeName: storeName,
        address: address,
        distance: distance.toFixed(1),
        station: station,
        walkMinutes: store.summary_walk_minutes || '-',
        imageUrl: imageUrl,
        updatedAt: updatedAt,
        isFavorite: isFav,
        favoriteClass: favoriteClass,
        favoriteIcon: favoriteIcon,
        favoriteText: favoriteText,
        hasItems: itemsHTML.length > 0,
        noItems: itemsHTML.length === 0,
        itemsHTML: itemsHTML,
        bestItemName: escapeHtml(store.summary_best_item_name || ''),
        bestItemPrice: formatPrice(store.summary_best_item_price || 0)
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/store-detail-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getStoreDetailPageHTMLFallback(storeId, storeName, address, distance, station, store.summary_walk_minutes, imageUrl, updatedAt, isFav, itemsHTML, store.summary_best_item_name, store.summary_best_item_price);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getStoreDetailPageHTMLFallback(storeId, storeName, address, distance, station, walkMinutes, imageUrl, updatedAt, isFav, itemsHTML, bestItemName, bestItemPrice) {
    return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <button id="favorite-button" class="btn-favorite ${isFav ? 'active' : 'inactive'}" data-store-id="${storeId}" data-is-favorite="${isFav}">
          <span class="text-xl">${isFav ? '❤️' : '🤍'}</span>
          <span>${isFav ? 'お気に入り済み' : 'お気に入りに追加'}</span>
        </button>
      </div>
      <div class="store-detail-card">
        <div class="relative">
          <img src="${imageUrl}" alt="${storeName}のチラシ" class="w-full h-80 object-cover" />
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
              <div><div class="font-medium text-gray-700">現在地からの距離</div><div>${distance.toFixed(1)} km</div></div>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-2xl">🚶</span>
              <div><div class="font-medium text-gray-700">最寄り駅</div><div>${station}から徒歩${walkMinutes}分</div></div>
            </div>
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
 * 店舗詳細ページのイベントを設定
 */
export function attachStoreDetailPageEvents() {
    // 戻るボタン
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }

    // お気に入りボタン
    const favoriteButton = document.getElementById('favorite-button');
    if (favoriteButton) {
        favoriteButton.addEventListener('click', () => {
            const storeId = parseInt(favoriteButton.dataset.storeId);
            const newState = toggleFavorite(storeId);

            // ボタンの表示を更新
            if (newState) {
                favoriteButton.className = 'btn-favorite active';
                favoriteButton.innerHTML = `
          <span class="text-xl">❤️</span>
          <span>お気に入り済み</span>
        `;
            } else {
                favoriteButton.className = 'btn-favorite inactive';
                favoriteButton.innerHTML = `
          <span class="text-xl">🤍</span>
          <span>お気に入りに追加</span>
        `;
            }

            favoriteButton.dataset.isFavorite = newState;
        });
    }
}