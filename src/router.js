import { HomePage, attachHomePageEvents } from './pages/HomePage.js';
import { StoresPage, attachStoresPageEvents } from './pages/StoresPage.js';
import { GenreStoresPage, attachGenreStoresPageEvents } from './pages/GenreStoresPage.js';
import { StoreDetailPage, attachStoreDetailPageEvents } from './pages/StoreDetailPage.js';
import { SearchResultsPage, attachSearchResultsPageEvents } from './pages/SearchResultsPage.js';

/**
 * ルートの定義
 */
const routes = {
    '/home': {
        render: HomePage,
        attachEvents: attachHomePageEvents
    },
    '/stores': {
        render: StoresPage,
        attachEvents: attachStoresPageEvents
    },
    '/genre/:genreId/stores': {
        render: GenreStoresPage,
        attachEvents: attachGenreStoresPageEvents
    },
    '/store/:storeId': {
        render: StoreDetailPage,
        attachEvents: attachStoreDetailPageEvents
    },
    '/search': {
        render: SearchResultsPage,
        attachEvents: attachSearchResultsPageEvents
    }
};

/**
 * パスとパラメータをマッチング
 * @param {string} pattern - ルートパターン
 * @param {string} path - 実際のパス
 * @returns {Object|null} パラメータオブジェクトまたはnull
 */
function matchRoute(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
        return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            // パラメータ部分
            const paramName = patternParts[i].slice(1);
            params[paramName] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
            // パスが一致しない
            return null;
        }
    }

    return params;
}

/**
 * 現在のルートを取得
 * @returns {Object} {route, params, queryParams}
 */
function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/home';
    const [pathWithQuery] = hash.split('?');
    const path = pathWithQuery.split('?')[0];

    // クエリパラメータを解析
    const queryParams = {};
    const queryString = hash.split('?')[1];
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            queryParams[key] = decodeURIComponent(value || '');
        });
    }

    // ルートをマッチング
    for (const [pattern, route] of Object.entries(routes)) {
        const params = matchRoute(pattern, path);
        if (params !== null) {
            return { route, params, queryParams };
        }
    }

    // マッチしない場合はホームにリダイレクト
    return {
        route: routes['/home'],
        params: {},
        queryParams: {}
    };
}

/**
 * ページを描画
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 */
export async function renderPage(userLocation) {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    // ローディング表示
    appContainer.innerHTML = `
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-pulse">⏳</div>
        <p class="text-gray-500 text-lg">読み込み中...</p>
      </div>
    </div>
  `;

    // ページトップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const { route, params, queryParams } = getCurrentRoute();

        // ページを描画
        let html;

        // 検索ページの場合は特別処理
        if (window.location.hash.includes('/search')) {
            const query = queryParams.q || '';
            const filters = {
                minPrice: parseInt(queryParams.minPrice) || 0,
                maxPrice: parseInt(queryParams.maxPrice) || 10000,
                maxDistance: parseInt(queryParams.maxDistance) || 10,
                sortBy: queryParams.sortBy || 'price-asc'
            };
            html = await route.render(query, userLocation, filters);
        } else if (Object.keys(params).length > 0) {
            // パラメータがある場合（例: /store/1）
            const paramValues = Object.values(params);
            html = await route.render(...paramValues, userLocation);
        } else {
            // パラメータがない場合
            html = await route.render(userLocation);
        }

        appContainer.innerHTML = html;

        // イベントをアタッチ
        if (route.attachEvents) {
            // 検索ページの場合はクエリを渡す
            if (window.location.hash.includes('/search')) {
                route.attachEvents(queryParams.q || '');
            } else {
                route.attachEvents();
            }
        }
    } catch (error) {
        console.error('ページ描画エラー:', error);
        appContainer.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">⚠️</div>
        <p class="text-gray-500 text-lg mb-4">ページの読み込みに失敗しました</p>
        <button 
          onclick="window.location.hash = '/home'"
          class="btn-primary"
        >
          ホームに戻る
        </button>
      </div>
    `;
    }
}

/**
 * ルーターを初期化
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 */
export function initRouter(userLocation) {
    // ハッシュ変更時にページを再描画
    window.addEventListener('hashchange', () => {
        renderPage(userLocation);
    });

    // 初回描画
    renderPage(userLocation);
}