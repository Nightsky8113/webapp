/**
 * 店舗のお気に入り機能をLocalStorageで管理するユーティリティ
 * お気に入りの追加、削除、確認、一覧取得などの機能を提供する
 */

const FAVORITES_KEY = 'favoriteStores';

/**
 * LocalStorageからお気に入り店舗IDのリストを取得する
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
 * 指定された店舗IDをお気に入りリストに追加する
 * 既にお気に入りに追加済みの場合は何もせずに成功を返す
 */
export function addFavorite(storeId) {
    try {
        const favorites = getFavorites();

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
 * 指定された店舗IDをお気に入りリストから削除する
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
 * 指定された店舗IDがお気に入りに登録されているかどうかを確認する
 */
export function isFavorite(storeId) {
    const favorites = getFavorites();
    return favorites.includes(storeId);
}

/**
 * お気に入りの追加/削除を切り替える
 * 既にお気に入りの場合は削除し、そうでない場合は追加する
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
 * お気に入りに登録されている店舗の総数を取得する
 */
export function getFavoritesCount() {
    return getFavorites().length;
}

/**
 * すべてのお気に入り登録を削除する
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
 * お気に入り店舗IDのリストから、実際の店舗データオブジェクトの配列を生成する
 * 全店舗配列からお気に入りIDに一致する店舗のみを抽出して返す
 */
export function getFavoriteStores(stores) {
    const favoriteIds = getFavorites();
    return stores.filter(store => favoriteIds.includes(store.id));
}