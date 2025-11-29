import { getStoreById, getLatestFlyerByStoreId, getItemsByFlyerId } from '../services/dataService.js';
import { calculateDistance } from '../utils/distance.js';
import { escapeHtml, formatPrice, formatDate } from '../utils/helpers.js';
import { isFavorite, toggleFavorite } from '../utils/favorites.js';

/**
 * 店舗詳細ページを描画
 * @param {number} storeId - 店舗ID
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @returns {Promise<string>} HTML文字列
 */
export async function StoreDetailPage(storeId, userLocation) {
    const store = await getStoreById(storeId);
    const flyer = await getLatestFlyerByStoreId(storeId);

    if (!store) {
        return `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">❌</div>
        <p class="text-gray-500 text-lg mb-4">店舗が見つかりませんでした</p>
        <button 
          id="back-button"
          class="btn-primary"
        >
          ホームに戻る
        </button>
      </div>
    `;
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

        itemsHTML = topItems
            .map(item => `
        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div class="text-xl font-bold text-gray-800 mb-2">
            ${escapeHtml(item.name)}
          </div>
          <div class="text-3xl font-bold text-red-600">
            ${formatPrice(item.price)}
          </div>
        </div>
      `)
            .join('');
    }

    const storeName = escapeHtml(store.name);
    const address = escapeHtml(store.address);
    const station = escapeHtml(store.nearest_station);
    const imageUrl = flyer?.image_url || 'https://via.placeholder.com/800x600?text=No+Image';
    const updatedAt = flyer ? formatDate(flyer.updated_at) : '-';
    const isFav = isFavorite(storeId);

    return `
    <div class="space-y-6">
      <!-- 戻るボタン -->
      <div class="flex items-center justify-between">
        <button 
          id="back-button"
          class="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
        >
          ← 戻る
        </button>
        
        <!-- お気に入りボタン -->
        <button 
          id="favorite-button"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isFav ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
          data-store-id="${storeId}"
          data-is-favorite="${isFav}"
        >
          <span class="text-xl">${isFav ? '❤️' : '🤍'}</span>
          <span class="font-medium">${isFav ? 'お気に入り済み' : 'お気に入りに追加'}</span>
        </button>
      </div>

      <!-- 店舗情報カード -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- チラシ画像 -->
        <div class="relative">
          <img 
            src="${imageUrl}"
            alt="${storeName}のチラシ"
            class="w-full h-80 object-cover"
          />
          <div class="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-md">
            <span class="text-sm text-gray-600">更新日: ${updatedAt}</span>
          </div>
        </div>
        
        <!-- 店舗詳細 -->
        <div class="p-8 space-y-6">
          <h1 class="text-4xl font-bold text-gray-800">${storeName}</h1>
          
          <!-- 基本情報 -->
          <div class="space-y-3 text-gray-600 text-lg">
            <div class="flex items-start gap-3">
              <span class="text-2xl">📍</span>
              <div>
                <div class="font-medium text-gray-700">住所</div>
                <div>${address}</div>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <span class="text-2xl">📏</span>
              <div>
                <div class="font-medium text-gray-700">現在地からの距離</div>
                <div>${distance.toFixed(1)} km</div>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <span class="text-2xl">🚶</span>
              <div>
                <div class="font-medium text-gray-700">最寄り駅</div>
                <div>${station}から徒歩${store.summary_walk_minutes}分</div>
              </div>
            </div>
          </div>

          <!-- 目玉商品 -->
          ${itemsHTML ? `
            <div class="border-t pt-6">
              <h2 class="text-2xl font-bold mb-5 flex items-center gap-2">
                <span>🏷️</span>
                本日の目玉商品
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${itemsHTML}
              </div>
            </div>
          ` : `
            <div class="border-t pt-6">
              <h2 class="text-2xl font-bold mb-5 flex items-center gap-2">
                <span>🏷️</span>
                おすすめ商品
              </h2>
              <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-5">
                <div class="text-xl font-bold text-gray-800 mb-2">
                  ${escapeHtml(store.summary_best_item_name)}
                </div>
                <div class="text-3xl font-bold text-red-600">
                  ${formatPrice(store.summary_best_item_price)}
                </div>
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
                favoriteButton.className = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500 text-white';
                favoriteButton.innerHTML = `
          <span class="text-xl">❤️</span>
          <span class="font-medium">お気に入り済み</span>
        `;
            } else {
                favoriteButton.className = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
                favoriteButton.innerHTML = `
          <span class="text-xl">🤍</span>
          <span class="font-medium">お気に入りに追加</span>
        `;
            }

            favoriteButton.dataset.isFavorite = newState;
        });
    }
}