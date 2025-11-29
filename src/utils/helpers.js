/**
 * XSS対策: HTMLエスケープ
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープ済み文字列
 */
export function escapeHtml(str) {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 数値を通貨形式にフォーマット
 * @param {number} price - 価格
 * @returns {string} フォーマット済み価格（例: "¥1,980"）
 */
export function formatPrice(price) {
    if (typeof price !== 'number') return '¥0';
    return `¥${price.toLocaleString('ja-JP')}`;
}

/**
 * 日付を日本語形式にフォーマット
 * @param {string} dateStr - 日付文字列（ISO形式）
 * @returns {string} フォーマット済み日付（例: "2025年11月29日"）
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
 * 今日の日付を取得（YYYY-MM-DD形式）
 * @returns {string} 今日の日付
 */
export function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * 配列をシャッフル
 * @param {Array} array - シャッフルする配列
 * @returns {Array} シャッフル済み配列
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
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} delay - 遅延時間（ms）
 * @returns {Function} デバウンス済み関数
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * ローカルストレージにデータを保存
 * @param {string} key - キー
 * @param {*} value - 保存する値
 */
export function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('LocalStorage保存エラー:', error);
    }
}

/**
 * ローカルストレージからデータを取得
 * @param {string} key - キー
 * @param {*} defaultValue - デフォルト値
 * @returns {*} 取得した値
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
 * URLのハッシュからパスとパラメータを取得
 * @returns {Object} {path, params}
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