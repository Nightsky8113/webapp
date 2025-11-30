import { getStores, getFlyers, getItems } from '../services/dataService.js';
import { searchItems, filterByPrice, sortByPrice } from '../utils/search.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { escapeHtml } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * 商品検索結果ページのコンテンツを生成する
 * 商品名で検索し、価格・距離でフィルタリング、価格順または距離順でソートして表示する
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

    // 結果のHTML生成（テンプレートを使用）
    const resultPromises = finalResults.map(async item => {
        const storeWithDistance = sortByDistance([item.store], userLocation)[0];
        const itemData = {
            itemName: escapeHtml(item.name),
            itemPrice: item.price.toLocaleString(),
            storeName: escapeHtml(item.store.name),
            distance: storeWithDistance.distance.toFixed(1),
            storeId: item.store.id
        };
        try {
            return await loadAndRenderTemplate('/src/templates/components/search-result-item.html', itemData);
        } catch (error) {
            return `
            <div class="search-result-card">
              <div class="flex items-start gap-4">
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-gray-800 mb-2">${itemData.itemName}</h3>
                  <div class="text-3xl font-bold text-red-600 mb-3">¥${itemData.itemPrice}</div>
                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex items-center gap-2"><span>🏪</span><span class="font-medium">${itemData.storeName}</span></div>
                    <div class="flex items-center gap-2"><span>📍</span><span>${itemData.distance} km</span></div>
                  </div>
                </div>
                <button class="btn-store-view" data-store-id="${itemData.storeId}">店舗を見る →</button>
              </div>
            </div>
          `;
        }
    });
    const resultsHTML = (await Promise.all(resultPromises)).join('');

    const queryText = escapeHtml(query);

    // テンプレートデータを準備
    const templateData = {
        queryText: queryText,
        minPrice: minPrice,
        maxPrice: maxPrice,
        maxDistance: maxDistance,
        sortByPriceAscSelected: sortBy === 'price-asc' ? 'selected' : '',
        sortByPriceDescSelected: sortBy === 'price-desc' ? 'selected' : '',
        sortByDistanceSelected: sortBy === 'distance' ? 'selected' : '',
        resultsCount: finalResults.length,
        resultsHTML: resultsHTML,
        noResults: finalResults.length === 0
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/search-results-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getSearchResultsPageHTMLFallback(queryText, minPrice, maxPrice, maxDistance, sortBy, finalResults.length, resultsHTML);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getSearchResultsPageHTMLFallback(queryText, minPrice, maxPrice, maxDistance, sortBy, resultsCount, resultsHTML) {
    return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="text-3xl font-bold text-gray-800">「${queryText}」の検索結果</h1>
      </div>
      <div class="filter-panel">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">最小価格</label>
            <input type="number" id="min-price" value="${minPrice}" min="0" class="filter-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">最大価格</label>
            <input type="number" id="max-price" value="${maxPrice}" min="0" class="filter-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">最大距離（km）</label>
            <input type="number" id="max-distance" value="${maxDistance}" min="1" max="50" class="filter-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">並び順</label>
            <select id="sort-by" class="filter-select">
              <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>価格（安い順）</option>
              <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>価格（高い順）</option>
              <option value="distance" ${sortBy === 'distance' ? 'selected' : ''}>距離（近い順）</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button id="apply-filters" class="btn-primary-large">フィルターを適用 →</button>
        </div>
      </div>
      <div class="info-box blue">
        <p>${resultsCount}件の商品が見つかりました</p>
      </div>
      <div class="space-y-4">${resultsHTML}</div>
      ${resultsCount === 0 ? `<div class="empty-state"><div class="empty-icon">🔍</div><p class="empty-text">検索結果が見つかりませんでした</p><p class="text-gray-400 text-sm mt-2">別のキーワードやフィルター設定をお試しください</p></div>` : ''}
    </div>
  `;
}

/**
 * 検索結果ページに必要なイベントハンドラーを設定する
 * 戻るボタンとフィルター適用ボタンのクリックイベントを設定し、フィルター値をURLパラメータに反映して再検索を実行する
 */
export function attachSearchResultsPageEvents(query) {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    const applyButton = document.getElementById('apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', () => {
            const minPrice = document.getElementById('min-price').value;
            const maxPrice = document.getElementById('max-price').value;
            const maxDistance = document.getElementById('max-distance').value;
            const sortBy = document.getElementById('sort-by').value;

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

    // 検索結果内の「店舗を見る」ボタンにイベントリスナーを追加
    const storeViewButtons = document.querySelectorAll('.btn-store-view[data-store-id]');
    storeViewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const storeId = button.getAttribute('data-store-id');
            if (storeId) {
                window.location.hash = `/store/${storeId}`;
            }
        });
    });
}