import { getStores, getFlyers, getItems } from '../services/dataService.js';
import { searchItems, filterByPrice, sortByPrice } from '../utils/search.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { escapeHtml } from '../utils/helpers.js';

/**
 * 検索結果ページを描画
 * @param {string} query - 検索クエリ
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @param {Object} filters - フィルター設定 {minPrice, maxPrice, maxDistance, sortBy}
 * @returns {Promise<string>} HTML文字列
 */
export async function SearchResultsPage(query, userLocation, filters = {}) {
    const items = await getItems();
    const stores = await getStores();
    const flyers = await getFlyers();

    // デフォルトフィルター
    const {
        minPrice = 0,
        maxPrice = 10000,
        maxDistance = 10,
        sortBy = 'price-asc' // 'price-asc', 'price-desc', 'distance'
    } = filters;

    // 商品を検索
    let searchResults = searchItems(items, query);

    // 価格でフィルタリング
    searchResults = filterByPrice(searchResults, minPrice, maxPrice);

    // 店舗情報を結合
    const resultsWithStore = searchResults.map(item => {
        const flyer = flyers.find(f => f.id === item.flyer_id);
        const store = stores.find(s => s.id === flyer?.store_id);
        return { ...item, store, flyer };
    }).filter(item => item.store); // 店舗がない商品を除外

    // ソート
    let sortedResults;
    if (sortBy === 'distance') {
        // 距離順（店舗ごとに距離を計算）
        const storesWithDistance = sortByDistance(
            stores.filter(s => resultsWithStore.some(r => r.store.id === s.id)),
            userLocation
        );

        sortedResults = resultsWithStore.sort((a, b) => {
            const distA = storesWithDistance.find(s => s.id === a.store.id)?.distance || 0;
            const distB = storesWithDistance.find(s => s.id === b.store.id)?.distance || 0;
            return distA - distB;
        });
    } else {
        // 価格順
        const order = sortBy === 'price-asc' ? 'asc' : 'desc';
        sortedResults = sortByPrice(resultsWithStore, order);
    }

    // 距離でフィルタリング
    const finalResults = sortedResults.filter(item => {
        const storeWithDistance = sortByDistance([item.store], userLocation)[0];
        return storeWithDistance.distance <= maxDistance;
    });

    // 結果のHTML生成
    const resultsHTML = finalResults.map(item => {
        const storeWithDistance = sortByDistance([item.store], userLocation)[0];

        return `
      <div class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
        <div class="flex items-start gap-4">
          <!-- 商品情報 -->
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800 mb-2">
              ${escapeHtml(item.name)}
            </h3>
            <div class="text-3xl font-bold text-red-600 mb-3">
              ¥${item.price.toLocaleString()}
            </div>
            
            <!-- 店舗情報 -->
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <span>🏪</span>
                <span class="font-medium">${escapeHtml(item.store.name)}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>📍</span>
                <span>${storeWithDistance.distance.toFixed(1)} km</span>
              </div>
            </div>
          </div>
          
          <!-- 店舗へのリンク -->
          <button 
            class="btn-primary text-sm whitespace-nowrap"
            onclick="window.location.hash = '/store/${item.store.id}'"
          >
            店舗を見る →
          </button>
        </div>
      </div>
    `;
    }).join('');

    const queryText = escapeHtml(query);

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
        <h1 class="text-3xl font-bold text-gray-800">
          「${queryText}」の検索結果
        </h1>
      </div>
      
      <!-- フィルター＆ソートパネル -->
      <div class="bg-white rounded-lg shadow-md p-5">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 最小価格 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              最小価格
            </label>
            <input 
              type="number" 
              id="min-price"
              value="${minPrice}"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <!-- 最大価格 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              最大価格
            </label>
            <input 
              type="number" 
              id="max-price"
              value="${maxPrice}"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <!-- 最大距離 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              最大距離（km）
            </label>
            <input 
              type="number" 
              id="max-distance"
              value="${maxDistance}"
              min="1"
              max="50"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <!-- ソート -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              並び順
            </label>
            <select 
              id="sort-by"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>価格（安い順）</option>
              <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>価格（高い順）</option>
              <option value="distance" ${sortBy === 'distance' ? 'selected' : ''}>距離（近い順）</option>
            </select>
          </div>
        </div>
        
        <!-- 適用ボタン -->
        <div class="mt-4 flex justify-end">
          <button 
            id="apply-filters"
            class="btn-primary"
          >
            フィルターを適用
          </button>
        </div>
      </div>
      
      <!-- 検索結果数 -->
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p class="text-blue-800 font-medium">
          ${finalResults.length}件の商品が見つかりました
        </p>
      </div>
      
      <!-- 検索結果一覧 -->
      <div class="space-y-4">
        ${resultsHTML}
      </div>
      
      ${finalResults.length === 0 ? `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-gray-500 text-lg mb-2">検索結果が見つかりませんでした</p>
          <p class="text-gray-400 text-sm">別のキーワードやフィルター設定をお試しください</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 検索結果ページのイベントを設定
 * @param {string} query - 検索クエリ
 */
export function attachSearchResultsPageEvents(query) {
    // 戻るボタン
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    // フィルター適用ボタン
    const applyButton = document.getElementById('apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', () => {
            const minPrice = document.getElementById('min-price').value;
            const maxPrice = document.getElementById('max-price').value;
            const maxDistance = document.getElementById('max-distance').value;
            const sortBy = document.getElementById('sort-by').value;

            // URLパラメータで再検索
            const params = new URLSearchParams({
                q: query,
                minPrice,
                maxPrice,
                maxDistance,
                sortBy
            });

            window.location.hash = `/search?${params.toString()}`;
        });
    }
}