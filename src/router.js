import { HomePage, attachHomePageEvents } from './pages/HomePage.js';
import { StoresPage, attachStoresPageEvents } from './pages/StoresPage.js';
import { GenrePage, attachGenrePageEvents } from './pages/GenrePage.js';
import { GenreStoresPage, attachGenreStoresPageEvents } from './pages/GenreStoresPage.js';
import { StoreDetailPage, attachStoreDetailPageEvents } from './pages/StoreDetailPage.js';
import { SearchResultsPage, attachSearchResultsPageEvents } from './pages/SearchResultsPage.js';
import { StoreUploadPage, attachStoreUploadPageEvents } from './pages/StoreUploadPage.js';
import { StoreRegisterPage, attachStoreRegisterPageEvents } from './pages/StoreRegisterPage.js';
import { StoreLoginPage, attachStoreLoginPageEvents } from './pages/StoreLoginPage.js';
import { AdminUploadPage, attachAdminUploadPageEvents } from './pages/AdminUploadPage.js';
import { HowToUsePage, attachHowToUsePageEvents } from './pages/HowToUsePage.js';
import { parseHash } from './utils/helpers.js';

const routes = {
    '/home': { render: HomePage, attachEvents: attachHomePageEvents },
    '/genre': { render: GenrePage, attachEvents: attachGenrePageEvents },
    '/stores': { render: StoresPage, attachEvents: attachStoresPageEvents },
    '/genre/:genreId/stores': { render: GenreStoresPage, attachEvents: attachGenreStoresPageEvents },
    '/store/upload': { render: StoreUploadPage, attachEvents: attachStoreUploadPageEvents },
    '/store/register': { render: StoreRegisterPage, attachEvents: attachStoreRegisterPageEvents },
    '/store/login': { render: StoreLoginPage, attachEvents: attachStoreLoginPageEvents },
    '/store/:storeId': { render: StoreDetailPage, attachEvents: attachStoreDetailPageEvents },
    '/search': { render: SearchResultsPage, attachEvents: attachSearchResultsPageEvents },
    '/admin/upload': { render: AdminUploadPage, attachEvents: attachAdminUploadPageEvents },
    '/how-to-use': { render: HowToUsePage, attachEvents: attachHowToUsePageEvents }
};

/** マッチ優先順（固定パスを :storeId より先に） */
const ROUTE_ORDER = [
    '/home',
    '/genre',
    '/stores',
    '/genre/:genreId/stores',
    '/store/upload',
    '/store/register',
    '/store/login',
    '/store/:storeId',
    '/search',
    '/admin/upload',
    '/how-to-use'
];

function matchRoute(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
        return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            params[patternParts[i].slice(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
            return null;
        }
    }

    return params;
}

function getCurrentRoute() {
    const { path, params: queryParams } = parseHash();

    for (const pattern of ROUTE_ORDER) {
        const params = matchRoute(pattern, path);
        if (params !== null) {
            return { route: routes[pattern], params, queryParams };
        }
    }

    return {
        route: routes['/home'],
        params: {},
        queryParams: {}
    };
}

export async function renderPage(userLocation) {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error('appコンテナが見つかりません');
        return;
    }

    appContainer.innerHTML = `
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-pulse">⏳</div>
        <p class="text-gray-500 text-lg">読み込み中...</p>
      </div>
    </div>
  `;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let route;
    try {
        const current = getCurrentRoute();
        route = current.route;
        const { params, queryParams } = current;

        if (queryParams.lat && queryParams.lng) {
            userLocation = {
                lat: parseFloat(queryParams.lat),
                lng: parseFloat(queryParams.lng)
            };
        }

        let html;

        if (pathIsSearch()) {
            html = await route.render(
                queryParams.q || '',
                userLocation,
                buildSearchFilters(queryParams)
            );
        } else if (Object.keys(params).length > 0) {
            const paramValues = Object.values(params).map(coerceRouteParam);
            html = await route.render(...paramValues, userLocation);
        } else {
            html = await route.render(userLocation);
        }

        if (!html) {
            throw new Error('ページのHTMLが空です: ' + route.render.name);
        }

        appContainer.innerHTML = html;

        if (route.attachEvents) {
            const attachResult = pathIsSearch()
                ? route.attachEvents(queryParams.q || '')
                : route.attachEvents();
            if (attachResult instanceof Promise) {
                await attachResult;
            }
        }
    } catch (error) {
        console.error('ページ描画エラー:', error);
        appContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-gray-500 text-lg mb-4">ページの読み込みに失敗しました</p>
                <p class="text-gray-400 text-sm mb-4">${error.message || '不明なエラー'}</p>
                <button id="back-to-home-button" class="btn-primary">ホームに戻る</button>
            </div>
        `;
        document.getElementById('back-to-home-button')?.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }
}

function pathIsSearch() {
    return window.location.hash.includes('/search');
}

function buildSearchFilters(queryParams) {
    const sortBy = ['price-asc', 'price-desc', 'distance'].includes(queryParams.sortBy)
        ? queryParams.sortBy
        : 'price-asc';
    return {
        minPrice: parseInt(queryParams.minPrice, 10) || 0,
        maxPrice: parseInt(queryParams.maxPrice, 10) || 10000,
        maxDistance: parseInt(queryParams.maxDistance, 10) || 10,
        sortBy
    };
}

function coerceRouteParam(val) {
    const numVal = Number(val);
    return !isNaN(numVal) && numVal.toString() === val ? numVal : val;
}

export function initRouter(userLocation) {
    window.addEventListener('hashchange', () => {
        renderPage(userLocation);
        updateActiveNavLink();
    });

    renderPage(userLocation);
    updateActiveNavLink();
}

function updateActiveNavLink() {
    const currentPath = (window.location.hash.slice(1) || '/home').split('?')[0];

    document.querySelectorAll('#app-header nav a').forEach((link) => {
        link.classList.remove('active');
        const linkPath = link.getAttribute('href')?.replace('#', '') || '';
        if (currentPath === linkPath || (linkPath !== '/home' && currentPath.startsWith(linkPath))) {
            link.classList.add('active');
        }
    });
}
