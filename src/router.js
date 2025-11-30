import { HomePage, attachHomePageEvents } from './pages/HomePage.js';
import { StoresPage, attachStoresPageEvents } from './pages/StoresPage.js';
import { GenrePage, attachGenrePageEvents } from './pages/GenrePage.js';
import { GenreStoresPage, attachGenreStoresPageEvents } from './pages/GenreStoresPage.js';
import { StoreDetailPage, attachStoreDetailPageEvents } from './pages/StoreDetailPage.js';
import { SearchResultsPage, attachSearchResultsPageEvents } from './pages/SearchResultsPage.js';
import { AdminUploadPage, attachAdminUploadPageEvents } from './pages/AdminUploadPage.js';

/**
 * アプリケーションのルート定義
 * 各ルートは対応するページコンポーネントとイベントハンドラーを指定する
 */
const routes = {
    '/home': {
        render: HomePage,
        attachEvents: attachHomePageEvents
    },
    '/genre': {
        render: GenrePage,
        attachEvents: attachGenrePageEvents
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
    },
    '/admin/upload': {
        render: AdminUploadPage,
        attachEvents: attachAdminUploadPageEvents
    }
};

/**
 * ルートパターンと実際のパスを比較し、パラメータを抽出する
 * 例: '/store/:storeId' と '/store/123' をマッチさせ、{storeId: '123'} を返す
 * @param {string} pattern - ルートパターン（例: '/store/:storeId'）
 * @param {string} path - 実際のパス（例: '/store/123'）
 * @returns {Object|null} 抽出されたパラメータオブジェクト、マッチしない場合はnull
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
            const paramName = patternParts[i].slice(1);
            params[paramName] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
            return null;
        }
    }

    return params;
}

/**
 * 現在のURLからルート情報を取得し、マッチするルート定義とパラメータを返す
 * URLのハッシュとクエリパラメータを解析し、定義されたルートと照合する
 * @returns {Object} マッチしたルート定義、パラメータ、クエリパラメータを含むオブジェクト
 */
function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/home';
    const [path] = hash.split('?');

    const queryParams = {};
    const queryString = hash.split('?')[1];
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            queryParams[key] = decodeURIComponent(value || '');
        });
    }

    for (const [pattern, route] of Object.entries(routes)) {
        const params = matchRoute(pattern, path);
        if (params !== null) {
            return { route, params, queryParams };
        }
    }

    // マッチするルートがない場合、ホームページにフォールバック
    return {
        route: routes['/home'],
        params: {},
        queryParams: {}
    };
}

/**
 * 現在のURLに基づいて適切なページコンポーネントを描画する
 * URLパラメータやクエリ文字列を解析し、ページに必要なデータを渡す
 * ページ描画後、そのページ固有のイベントハンドラーを設定する
 * @param {Object|null} userLocation - ユーザーの位置情報 {lat, lng} または null
 */
export async function renderPage(userLocation) {
    console.log('🔍 renderPageが呼び出されました', { userLocation, hash: window.location.hash });
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error('❌ appコンテナが見つかりません');
        return;
    }

    // ページ遷移中の読み込み状態を表示してユーザーに視覚的フィードバックを提供
    appContainer.innerHTML = `
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-pulse">⏳</div>
        <p class="text-gray-500 text-lg">読み込み中...</p>
      </div>
    </div>
  `;

    // ページ遷移時にトップへスクロールして新しいコンテンツを見やすくする
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const { route, params, queryParams } = getCurrentRoute();
        console.log('📍 現在のルート:', { route: route ? '見つかりました' : '見つかりませんでした', params, queryParams });
        if (!route) {
            throw new Error('ルートが見つかりません: ' + window.location.hash);
        }

        // URLのクエリパラメータから位置情報を取得（位置情報検索時にURLに含まれる）
        if (queryParams.lat && queryParams.lng) {
            userLocation = {
                lat: parseFloat(queryParams.lat),
                lng: parseFloat(queryParams.lng)
            };
        }

        let html;

        console.log('🎨 ページを描画しようとしています...', { 
            routeName: route.render.name,
            hasParams: Object.keys(params).length > 0,
            isSearch: window.location.hash.includes('/search')
        });

        // 検索ページは検索クエリとフィルターオプションを受け取る
        if (window.location.hash.includes('/search')) {
            const query = queryParams.q || '';
            const filters = {
                minPrice: parseInt(queryParams.minPrice) || 0,
                maxPrice: parseInt(queryParams.maxPrice) || 10000,
                maxDistance: parseInt(queryParams.maxDistance) || 10,
                sortBy: queryParams.sortBy || 'price-asc'
            };
            console.log('🔍 検索ページを描画中...', { query, filters });
            html = await route.render(query, userLocation, filters);
            console.log('✅ 検索ページのHTMLを取得しました', { htmlLength: html?.length || 0 });
        } else if (Object.keys(params).length > 0) {
            // パラメータ付きルート（例: /store/1, /genre/2/stores）の場合は数値に変換して渡す
            const paramValues = Object.values(params).map(val => {
                const numVal = Number(val);
                return !isNaN(numVal) && numVal.toString() === val ? numVal : val;
            });
            console.log('📄 パラメータ付きページを描画中...', { paramValues, userLocation });
            html = await route.render(...paramValues, userLocation);
            console.log('✅ パラメータ付きページのHTMLを取得しました', { htmlLength: html?.length || 0 });
        } else {
            // パラメータなしルート（例: /home, /genre）
            console.log('🏠 パラメータなしページを描画中...', { userLocation });
            html = await route.render(userLocation);
            console.log('✅ パラメータなしページのHTMLを取得しました', { htmlLength: html?.length || 0, htmlPreview: html?.substring(0, 200) });
        }

        if (!html) {
            throw new Error('ページのHTMLが空です: ' + route.render.name);
        }

        console.log('📝 HTMLをコンテナに設定します...', { htmlLength: html.length });
        appContainer.innerHTML = html;
        console.log('✅ HTMLをコンテナに設定しました');

        // ページ固有のイベントハンドラーを設定（クリック、フォーム送信など）
        if (route.attachEvents) {
            if (window.location.hash.includes('/search')) {
                const result = route.attachEvents(queryParams.q || '');
                if (result instanceof Promise) {
                    await result;
                }
            } else {
                // 非同期のイベントハンドラー設定に対応（地図初期化など）
                const result = route.attachEvents();
                if (result instanceof Promise) {
                    await result;
                }
            }
        }
    } catch (error) {
        console.error('ページ描画エラー:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            route: route?.render?.name || 'unknown',
            hash: window.location.hash
        });
        
        // エラー発生時にユーザーに分かりやすいエラーメッセージと復帰方法を表示
        appContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-gray-500 text-lg mb-4">ページの読み込みに失敗しました</p>
                <p class="text-gray-400 text-sm mb-4">${error.message || '不明なエラー'}</p>
                <button 
                    id="back-to-home-button"
                    class="btn-primary"
                >
                    ホームに戻る
                </button>
            </div>
        `;
        // イベントリスナーを追加
        const backButton = document.getElementById('back-to-home-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.hash = '/home';
            });
        }
    }
}

/**
 * クライアントサイドルーティングを初期化し、URLのハッシュ変更を監視する
 * ハッシュが変更されるたびに適切なページを描画する
 * @param {Object|null} userLocation - ユーザーの位置情報 {lat, lng} または null
 */
export function initRouter(userLocation) {
    // URLハッシュの変更を監視してページ遷移を実現
    window.addEventListener('hashchange', () => {
        renderPage(userLocation);
    });

    // アプリ起動時の初回ページ描画
    renderPage(userLocation);
}