/**
 * 商品検索機能を提供するユーティリティ
 * 商品名で部分一致検索、価格フィルタリング、価格ソートなどの機能を提供
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
