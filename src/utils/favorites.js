/**
 * お気に入り管理ユーティリティ
 * LocalStorageを使用して店舗のお気に入りを管理
 */

const FAVORITES_KEY = 'favoriteStores';

/**
 * お気に入り店舗を取得
 * @returns {Array<number>} お気に入り店舗IDの配列
 */
export function getFavorites() {
    try {
        const favorites = localStorage.getItem(FAVORITES_KEY);
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('お気に入りの取得エラー:', error);
        return [];
    }
}

/**
 * 店舗をお気に入りに追加
 * @param {number} storeId - 店舗ID
 * @returns {boolean} 成功したかどうか
 */
export function addFavorite(storeId) {
    try {
        const favorites = getFavorites();

        // 既に追加済みの場合はスキップ
        if (favorites.includes(storeId)) {
            return true;
        }

        favorites.push(storeId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

        return true;
    } catch (error) {
        console.error('お気に入りの追加エラー:', error);
        return false;
    }
}

/**
 * 店舗をお気に入りから削除
 * @param {number} storeId - 店舗ID
 * @returns {boolean} 成功したかどうか
 */
export function removeFavorite(storeId) {
    try {
        const favorites = getFavorites();
        const filtered = favorites.filter(id => id !== storeId);

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));

        return true;
    } catch (error) {
        console.error('お気に入りの削除エラー:', error);
        return false;
    }
}

/**
 * 店舗がお気に入りかどうかチェック
 * @param {number} storeId - 店舗ID
 * @returns {boolean} お気に入りかどうか
 */
export function isFavorite(storeId) {
    const favorites = getFavorites();
    return favorites.includes(storeId);
}

/**
 * お気に入りをトグル（追加/削除を切り替え）
 * @param {number} storeId - 店舗ID
 * @returns {boolean} トグル後の状態（true: お気に入り、false: 非お気に入り）
 */
export function toggleFavorite(storeId) {
    if (isFavorite(storeId)) {
        removeFavorite(storeId);
        return false;
    } else {
        addFavorite(storeId);
        return true;
    }
}

/**
 * お気に入り店舗の数を取得
 * @returns {number} お気に入り店舗数
 */
export function getFavoritesCount() {
    return getFavorites().length;
}

/**
 * すべてのお気に入りをクリア
 * @returns {boolean} 成功したかどうか
 */
export function clearFavorites() {
    try {
        localStorage.removeItem(FAVORITES_KEY);
        return true;
    } catch (error) {
        console.error('お気に入りのクリアエラー:', error);
        return false;
    }
}

/**
 * お気に入り店舗のデータを取得
 * @param {Array} stores - 全店舗配列
 * @returns {Array} お気に入り店舗の配列
 */
export function getFavoriteStores(stores) {
    const favoriteIds = getFavorites();
    return stores.filter(store => favoriteIds.includes(store.id));
}