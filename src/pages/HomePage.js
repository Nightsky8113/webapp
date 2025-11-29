import { getStores, getFlyers, getGenres, getTodayFlyers } from '../services/dataService.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { GenreCard, attachGenreCardEvents } from '../components/GenreCard.js';
import { debounce } from '../utils/helpers.js';
import { getFavoriteStores } from '../utils/favorites.js';

/**
 * ホームページを描画
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @returns {Promise<string>} HTML文字列
 */
export async function HomePage(userLocation) {
    const stores = await getStores();
    const flyers = await getFlyers();
    const genres = await getGenres();
    const todayFlyers = await getTodayFlyers();

    // 距離順にソート
    const storesWithDistance = sortByDistance(stores, userLocation);

    // お気に入り店舗
    const favoriteStores = getFavoriteStores(stores);
    const favoriteStoresWithDistance = sortByDistance(favoriteStores, userLocation);
    const favoritesHTML = favoriteStoresWithDistance
        .map(store => {
            const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
            return StoreCard(store, flyer, store.distance);
        })
        .join('');

    // 近くの店舗（上位3件）
    const nearbyStores = storesWithDistance.slice(0, 3);
    const nearbyStoresHTML = nearbyStores
        .map(store => {
            const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
            return StoreCard(store, flyer, store.distance);
        })
        .join('');

    // 今日更新されたチラシ
    const todayStoresHTML = todayFlyers
        .map(flyer => {
            const store = stores.find(s => s.id === flyer.store_id);
            if (!store) return '';

            const storeWithDistance = storesWithDistance.find(s => s.id === store.id);
            return StoreCard(store, flyer, storeWithDistance?.distance);
        })
        .join('');

    // ジャンル一覧
    const genresHTML = genres.map(genre => GenreCard(genre)).join('');

    return `
    <div class="space-y-8">
      <!-- ヒーローセクション -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg">
        <h1 class="text-3xl md:text-4xl font-bold mb-3">🛒 チラシ検索</h1>
        <p class="text-blue-100 text-lg">近くのお得な商品をすぐに見つけよう</p>
      </div>

      <!-- 検索バー -->
      <div class="relative">
        <input
          type="text"
          id="search-input"
          placeholder="商品名で検索..."
          class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
        <span class="absolute left-4 top-4 text-2xl">🔍</span>
      </div>

      <!-- 商品から探す -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-2xl font-bold text-gray-800">商品から探す</h2>
        </div>
        <div 
          id="genres-container" 
          class="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          ${genresHTML}
        </div>
      </section>

      <!-- お気に入り店舗 -->
      ${favoriteStores.length > 0 ? `
        <section>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-2xl font-bold text-gray-800">❤️ お気に入りの店舗</h2>
          </div>
          <div 
            id="favorite-stores-container" 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            ${favoritesHTML}
          </div>
        </section>
      ` : ''}

      <!-- 近くの店舗 -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-2xl font-bold text-gray-800">📍 近くの店舗</h2>
          <a 
            href="#/stores" 
            class="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700 transition-colors font-medium"
          >
            すべて見る →
          </a>
        </div>
        <div 
          id="nearby-stores-container" 
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          ${nearbyStoresHTML}
        </div>
      </section>

      <!-- 今日更新されたチラシ -->
      ${todayFlyers.length > 0 ? `
        <section>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-2xl font-bold text-gray-800">🆕 今日更新されたチラシ</h2>
          </div>
          <div 
            id="today-flyers-container" 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            ${todayStoresHTML}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

/**
 * ホームページのイベントを設定
 */
export function attachHomePageEvents() {
    // 店舗カードのクリックイベント（お気に入り）
    const favoriteContainer = document.getElementById('favorite-stores-container');
    if (favoriteContainer) {
        attachStoreCardEvents(favoriteContainer, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }

    // 店舗カードのクリックイベント（近くの店舗）
    const nearbyContainer = document.getElementById('nearby-stores-container');
    if (nearbyContainer) {
        attachStoreCardEvents(nearbyContainer, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }

    // 店舗カードのクリックイベント（今日更新）
    const todayContainer = document.getElementById('today-flyers-container');
    if (todayContainer) {
        attachStoreCardEvents(todayContainer, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }

    // ジャンルカードのクリックイベント
    const genresContainer = document.getElementById('genres-container');
    if (genresContainer) {
        attachGenreCardEvents(genresContainer, (genreId) => {
            window.location.hash = `/genre/${genreId}/stores`;
        });
    }

    // 検索入力のデバウンス処理
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const handleSearch = debounce((query) => {
            if (query.trim().length > 0) {
                // Phase 2: 検索機能実装済み
                window.location.hash = `/search?q=${encodeURIComponent(query)}`;
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        // Enterキーでも検索
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim().length > 0) {
                window.location.hash = `/search?q=${encodeURIComponent(searchInput.value)}`;
            }
        });
    }

    // ロゴクリックでホームに戻る
    const logo = document.getElementById('logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }
}