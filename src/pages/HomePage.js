import { getFlyers, getTodayFlyers } from '../services/dataService.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';

/**
 * ホームページを描画
 * @param {Object|null} userLocation - ユーザーの位置情報 {lat, lng} または null
 * @returns {Promise<string>} HTML文字列
 */
export async function HomePage(userLocation) {
    const todayFlyers = await getTodayFlyers();
    
    // 店舗情報を取得
    const { getStores } = await import('../services/dataService.js');
    const allStores = await getStores();
    
    // 今日更新されたチラシの店舗IDを取得
    const storeIds = [...new Set(todayFlyers.map(f => f.store_id))];
    const todayStores = allStores.filter(s => storeIds.includes(s.id));

    // 今日更新されたチラシの店舗カードHTML
    const todayStoresHTML = todayFlyers
        .map(flyer => {
            const store = todayStores.find(s => s.id === flyer.store_id);
            if (!store) return '';
            return StoreCard(store, flyer, undefined); // 距離は表示しない
        })
        .join('');

    return `
    <div class="space-y-8">
      <!-- ヒーローセクション -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg">
        <h1 class="text-3xl md:text-4xl font-bold mb-3">🛒 チラシ検索</h1>
        <p class="text-blue-100 text-lg">近くのお得な商品をすぐに見つけよう</p>
      </div>

      <!-- お店を探す -->
      <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-5">お店を探す</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 商品から探す -->
          <div 
            id="search-by-product"
            class="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-blue-200 hover:border-blue-400"
          >
            <div class="text-center">
              <div class="text-5xl mb-4">🛍️</div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">商品から探す</h3>
              <p class="text-gray-600 text-sm mb-4">商品名で検索またはジャンルから選択</p>
              <p class="text-blue-600 text-xs">位置情報から5km圏内の商品を安い順で表示</p>
            </div>
          </div>

          <!-- 位置情報から探す -->
          <div 
            id="search-by-location"
            class="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-green-200 hover:border-green-400"
          >
            <div class="text-center">
              <div class="text-5xl mb-4">📍</div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">位置情報から探す</h3>
              <p class="text-gray-600 text-sm mb-4">現在地から近い順に店舗を表示</p>
              <p class="text-green-600 text-xs">最大6店舗を距離順で表示</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 今日更新されたチラシ -->
      ${todayFlyers.length > 0 ? `
        <section>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-2xl font-bold text-gray-800">🆕 更新日時が今日のチラシ</h2>
          </div>
          <div 
            id="today-flyers-container" 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            ${todayStoresHTML}
          </div>
        </section>
      ` : `
        <section>
          <div class="bg-gray-50 rounded-lg p-8 text-center">
            <div class="text-4xl mb-3">📰</div>
            <p class="text-gray-500">今日更新されたチラシはありません</p>
          </div>
        </section>
      `}
    </div>
  `;
}

/**
 * ホームページのイベントを設定
 */
export function attachHomePageEvents() {
    // 商品から探すボタン
    const searchByProduct = document.getElementById('search-by-product');
    if (searchByProduct) {
        searchByProduct.addEventListener('click', async () => {
            try {
                // 位置情報を取得してからジャンルページへ遷移
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                window.location.hash = `/genre?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            } catch (error) {
                alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
            }
        });
    }

    // 位置情報から探すボタン
    const searchByLocation = document.getElementById('search-by-location');
    if (searchByLocation) {
        searchByLocation.addEventListener('click', async () => {
            try {
                // 位置情報を取得してから店舗一覧ページへ遷移
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                window.location.hash = `/stores?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            } catch (error) {
                alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
            }
        });
    }

    // 店舗カードのクリックイベント（今日更新）
    const todayContainer = document.getElementById('today-flyers-container');
    if (todayContainer) {
        attachStoreCardEvents(todayContainer, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }
}