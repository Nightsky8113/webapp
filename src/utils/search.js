/**
 * 商品や店舗の検索機能を提供するユーティリティ
 * 商品名、店舗名、住所、最寄り駅などで部分一致検索を行う
 */

/**
 * 商品名で部分一致検索を実行する
 * 検索クエリが空の場合は全商品を返す
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
 * 店舗名、住所、最寄り駅で部分一致検索を実行する
 * 検索クエリが空の場合は全店舗を返す
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
 * 指定した価格範囲内の商品のみをフィルタリングする
 */
export function filterByPrice(items, minPrice = 0, maxPrice = Infinity) {
    return items.filter(item => {
        const price = item.price || 0;
        return price >= minPrice && price <= maxPrice;
    });
}

/**
 * 商品リストを価格順（昇順または降順）にソートする
 */
export function sortByPrice(items, order = 'asc') {
    const sorted = [...items].sort((a, b) => {
        return order === 'asc' ? a.price - b.price : b.price - a.price;
    });
    return sorted;
}

/**
 * チラシリストを更新日時順（昇順または降順）にソートする
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
 * 検索クエリをLocalStorageに履歴として保存する
 * 重複を排除し、最新の検索が先頭に来るように管理する
 */
export function saveSearchHistory(query, maxHistory = 10) {
    if (!query || query.trim().length === 0) return;

    try {
        const history = getSearchHistory();

        const filteredHistory = history.filter(h => h !== query);

        filteredHistory.unshift(query);

        const limitedHistory = filteredHistory.slice(0, maxHistory);

        localStorage.setItem('searchHistory', JSON.stringify(limitedHistory));
    } catch (error) {
        console.error('検索履歴の保存エラー:', error);
    }
}

/**
 * LocalStorageから保存された検索履歴を取得する
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
 * 保存されている検索履歴をすべて削除する
 */
export function clearSearchHistory() {
    try {
        localStorage.removeItem('searchHistory');
    } catch (error) {
        console.error('検索履歴のクリアエラー:', error);
    }
}