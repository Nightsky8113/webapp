/**
 * 検索ユーティリティ
 * 商品名、店舗名での検索機能を提供
 */

/**
 * 商品を検索
 * @param {Array} items - 商品配列
 * @param {string} query - 検索クエリ
 * @returns {Array} 検索結果
 */
export function searchItems(items, query) {
    if (!query || query.trim().length === 0) {
        return items;
    }

    const normalizedQuery = query.toLowerCase().trim();

    return items.filter(item => {
        const itemName = (item.name || '').toLowerCase();
        return itemName.includes(normalizedQuery);
    });
}

/**
 * 店舗を検索
 * @param {Array} stores - 店舗配列
 * @param {string} query - 検索クエリ
 * @returns {Array} 検索結果
 */
export function searchStores(stores, query) {
    if (!query || query.trim().length === 0) {
        return stores;
    }

    const normalizedQuery = query.toLowerCase().trim();

    return stores.filter(store => {
        const storeName = (store.name || '').toLowerCase();
        const address = (store.address || '').toLowerCase();
        const station = (store.nearest_station || '').toLowerCase();

        return storeName.includes(normalizedQuery) ||
            address.includes(normalizedQuery) ||
            station.includes(normalizedQuery);
    });
}

/**
 * 商品を価格でフィルタリング
 * @param {Array} items - 商品配列
 * @param {number} minPrice - 最小価格
 * @param {number} maxPrice - 最大価格
 * @returns {Array} フィルタリング結果
 */
export function filterByPrice(items, minPrice = 0, maxPrice = Infinity) {
    return items.filter(item => {
        const price = item.price || 0;
        return price >= minPrice && price <= maxPrice;
    });
}

/**
 * 商品を価格でソート
 * @param {Array} items - 商品配列
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} ソート済み配列
 */
export function sortByPrice(items, order = 'asc') {
    const sorted = [...items].sort((a, b) => {
        return order === 'asc' ? a.price - b.price : b.price - a.price;
    });
    return sorted;
}

/**
 * チラシを更新日でソート
 * @param {Array} flyers - チラシ配列
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} ソート済み配列
 */
export function sortByDate(flyers, order = 'desc') {
    const sorted = [...flyers].sort((a, b) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
}

/**
 * 検索履歴を保存
 * @param {string} query - 検索クエリ
 * @param {number} maxHistory - 最大保存件数
 */
export function saveSearchHistory(query, maxHistory = 10) {
    if (!query || query.trim().length === 0) return;

    try {
        const history = getSearchHistory();

        // 重複を削除
        const filteredHistory = history.filter(h => h !== query);

        // 先頭に追加
        filteredHistory.unshift(query);

        // 最大件数に制限
        const limitedHistory = filteredHistory.slice(0, maxHistory);

        localStorage.setItem('searchHistory', JSON.stringify(limitedHistory));
    } catch (error) {
        console.error('検索履歴の保存エラー:', error);
    }
}

/**
 * 検索履歴を取得
 * @returns {Array} 検索履歴
 */
export function getSearchHistory() {
    try {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('検索履歴の取得エラー:', error);
        return [];
    }
}

/**
 * 検索履歴をクリア
 */
export function clearSearchHistory() {
    try {
        localStorage.removeItem('searchHistory');
    } catch (error) {
        console.error('検索履歴のクリアエラー:', error);
    }
}