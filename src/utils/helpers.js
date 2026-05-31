/**
 * 汎用的なヘルパー関数を提供するユーティリティ
 * HTMLエスケープ、価格・日付フォーマット、LocalStorage操作などの共通機能を集約
 */

/**
 * 文字列をHTMLエスケープしてXSS攻撃を防ぐ
 * ユーザー入力や外部データをHTMLに埋め込む前に必ず使用する
 */
export function escapeHtml(str) {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 数値を日本の通貨形式（¥記号 + カンマ区切り）にフォーマットする
 */
export function formatPrice(price) {
    if (typeof price !== 'number') return '¥0';
    return `¥${price.toLocaleString('ja-JP')}`;
}

/**
 * 日付文字列を日本語形式（年月日）にフォーマットする
 */
export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

/**
 * 今日の日付をYYYY-MM-DD形式の文字列で取得する
 * データベースの日付比較などで使用する
 */
export function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * 配列の要素をランダムにシャッフルする
 * Fisher-Yatesアルゴリズムを使用して均等なシャッフルを実現する
 */
export function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 関数の実行を指定時間だけ遅延させるデバウンス関数を返す
 * 連続して呼び出される関数の実行回数を削減し、パフォーマンスを向上させる
 * 入力フィールドの検索など、頻繁に実行される処理に使用する
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * LocalStorageにデータをJSON形式で保存する
 * 保存に失敗した場合はエラーをログに記録する
 */
export function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('LocalStorage保存エラー:', error);
    }
}

/**
 * LocalStorageからデータを取得し、JSONとしてパースして返す
 * データが存在しない場合はデフォルト値を返す
 */
export function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('LocalStorage取得エラー:', error);
        return defaultValue;
    }
}

/**
 * 現在のURLハッシュからルートパスとクエリパラメータを解析して取得する
 * ルーティング処理で使用される
 */
export function parseHash() {
    const hash = window.location.hash.slice(1) || '/home';
    const [path, queryString] = hash.split('?');

    const params = {};
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
        });
    }

    return { path, params };
}

/**
 * URLハッシュからクエリパラメータを取得する
 * @param {string} hash - ハッシュ文字列（例: '#/store/1?lat=35.6812&lng=139.7671'）
 * @returns {URLSearchParams} クエリパラメータオブジェクト
 */
export function getQueryParamsFromHash(hash = null) {
    const hashString = hash || window.location.hash;
    const queryString = hashString.split('?')[1] || '';
    return new URLSearchParams(queryString);
}