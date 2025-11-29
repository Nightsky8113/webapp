import { getStores, getFlyers } from '../services/dataService.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';

/**
 * 店舗一覧ページを描画（距離順、最大6件）
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @returns {Promise<string>} HTML文字列
 */
export async function StoresPage(userLocation) {
    const stores = await getStores();
    const flyers = await getFlyers();

    // 位置情報がない場合はエラー表示
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        return `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📍</div>
        <p class="text-gray-500 text-lg mb-4">位置情報が必要です</p>
        <button 
          id="back-button"
          class="btn-primary"
        >
          戻る
        </button>
      </div>
    `;
    }

    // 距離順にソート（最大6件）
    const storesWithDistance = sortByDistance(stores, userLocation).slice(0, 6);

    const storesHTML = storesWithDistance
        .map(store => {
            const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
            return StoreCard(store, flyer, store.distance);
        })
        .join('');

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
        <h1 class="text-3xl font-bold text-gray-800">近くの店舗（距離順）</h1>
      </div>
      
      <!-- 説明 -->
      <p class="text-gray-600">
        現在地から近い順に最大6件の店舗を表示しています
      </p>
      
      <!-- 店舗一覧 -->
      <div 
        id="stores-container" 
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        ${storesHTML}
      </div>
      
      ${storesWithDistance.length === 0 ? `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🏪</div>
          <p class="text-gray-500 text-lg">近くに店舗が見つかりませんでした</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 店舗一覧ページのイベントを設定
 */
export function attachStoresPageEvents() {
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