import { getStoresByGenreId, getGenreById, getFlyers } from '../services/dataService.js';
import { filterByDistance, sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { escapeHtml } from '../utils/helpers.js';

/**
 * ジャンル別店舗一覧ページを描画（5km以内）
 * @param {number} genreId - ジャンルID
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @returns {Promise<string>} HTML文字列
 */
export async function GenreStoresPage(genreId, userLocation) {
    const genre = await getGenreById(genreId);
    const stores = await getStoresByGenreId(genreId);
    const flyers = await getFlyers();

    if (!genre) {
        return `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">❌</div>
        <p class="text-gray-500 text-lg mb-4">ジャンルが見つかりませんでした</p>
        <button 
          id="back-button"
          class="btn-primary"
        >
          ホームに戻る
        </button>
      </div>
    `;
    }

    // 5km以内にフィルタリング & 距離順ソート
    const nearbyStores = filterByDistance(stores, userLocation, 5);
    const storesWithDistance = sortByDistance(nearbyStores, userLocation);

    const storesHTML = storesWithDistance
        .map(store => {
            const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
            return StoreCard(store, flyer, store.distance);
        })
        .join('');

    const genreName = escapeHtml(genre.name);
    const icon = genre.icon || '📦';

    return `
    <div class="space-y-6">
      <!-- ヘッダー -->
      <div class="flex items-center gap-4">
        <button 
          id="back-button"
          class="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
        >
          ← 戻る
        </button>
        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span class="text-4xl">${icon}</span>
          ${genreName}を扱う店舗
        </h1>
      </div>
      
      <!-- 説明 -->
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p class="text-blue-800">
          現在地から5km以内の店舗を距離順に表示しています（${storesWithDistance.length}件）
        </p>
      </div>
      
      <!-- 店舗一覧 -->
      <div 
        id="stores-container" 
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        ${storesHTML}
      </div>
      
      ${storesWithDistance.length === 0 ? `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-gray-500 text-lg mb-2">近くに該当する店舗が見つかりませんでした</p>
          <p class="text-gray-400 text-sm">範囲を広げるか、別のジャンルをお試しください</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * ジャンル別店舗一覧ページのイベントを設定
 */
export function attachGenreStoresPageEvents() {
    // 戻るボタン
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    // 店舗カードのクリックイベント
    const container = document.getElementById('stores-container');
    if (container) {
        attachStoreCardEvents(container, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }
}