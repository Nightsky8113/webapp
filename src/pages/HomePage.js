import { getFlyers, getTodayFlyers } from '../services/dataService.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * ホームページを描画（分離版）
 * HTMLは外部テンプレート、CSSはカスタムクラスを使用
 * 
 * @param {Object|null} userLocation - ユーザーの位置情報 {lat, lng} または null
 * @returns {Promise<string>} HTML文字列
 */
export async function HomePage(userLocation) {
    const todayFlyers = await getTodayFlyers();
    
    // 店舗情報を取得
    const { getStores } = await import('../services/dataService.js');
    const allStores = await getStores();
    
    // 今日更新されたチラシの店舗IDを取得
    const storeIds = [...new Set(todayFlyers.map(f => f.store_id))];
    const todayStores = allStores.filter(s => storeIds.includes(s.id));

    // 今日更新されたチラシの店舗カードHTML
    const todayStoresHTMLPromises = todayFlyers.map(async flyer => {
        const store = todayStores.find(s => s.id === flyer.store_id);
        if (!store) return '';
        return await StoreCard(store, flyer, undefined); // 距離は表示しない
    });
    const todayStoresHTML = (await Promise.all(todayStoresHTMLPromises)).join('');

    // テンプレートデータを準備
    const templateData = {
        hasTodayFlyers: todayFlyers.length > 0,
        noTodayFlyers: todayFlyers.length === 0,
        todayStoresHTML: todayStoresHTML
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/home-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        // フォールバック: インラインHTML（既存の方法）
        return getHomePageHTMLFallback(todayFlyers, todayStoresHTML);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getHomePageHTMLFallback(todayFlyers, todayStoresHTML) {
    return `
    <div class="space-y-8">
      <div class="hero-section">
        <h1>🛒 チラシ検索</h1>
        <p>近くのお得な商品をすぐに見つけよう</p>
      </div>
      <section>
        <h2 class="section-title">お店を探す</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button id="search-by-product" class="search-option-card product">
            <div class="flex flex-col items-center md:items-start">
              <div class="card-icon">🛍️</div>
              <h3 class="card-title">商品から探す</h3>
              <p class="card-description">商品名で検索またはジャンルから選択できます</p>
              <div class="card-info">📍 位置情報から5km圏内の商品を安い順で表示</div>
              <div class="card-action"><span>選択する</span><span class="arrow">→</span></div>
            </div>
          </button>
          <button id="search-by-location" class="search-option-card location">
            <div class="flex flex-col items-center md:items-start">
              <div class="card-icon">📍</div>
              <h3 class="card-title">位置情報から探す</h3>
              <p class="card-description">現在地から近い順に店舗を表示します</p>
              <div class="card-info">🏪 最大6店舗を距離順で表示</div>
              <div class="card-action"><span>選択する</span><span class="arrow">→</span></div>
            </div>
          </button>
        </div>
      </section>
      ${todayFlyers.length > 0 ? `
        <section>
          <div class="flex items-center justify-between mb-5">
            <h2 class="section-title">🆕 更新日時が今日のチラシ</h2>
          </div>
          <div id="today-flyers-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${todayStoresHTML}
          </div>
        </section>
      ` : `
        <section>
          <div class="empty-state">
            <div class="empty-icon">📰</div>
            <p class="empty-text">今日更新されたチラシはありません</p>
          </div>
        </section>
      `}
    </div>
  `;
}

/**
 * ホームページのイベントを設定
 */
export function attachHomePageEvents() {
    // 商品から探すボタン
    const searchByProduct = document.getElementById('search-by-product');
    if (searchByProduct) {
        searchByProduct.addEventListener('click', async () => {
            try {
                // 位置情報を取得してからジャンルページへ遷移
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                window.location.hash = `/genre?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            } catch (error) {
                alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
            }
        });
    }

    // 位置情報から探すボタン
    const searchByLocation = document.getElementById('search-by-location');
    if (searchByLocation) {
        searchByLocation.addEventListener('click', async () => {
            try {
                // 位置情報を取得してから店舗一覧ページへ遷移
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                window.location.hash = `/stores?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            } catch (error) {
                alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
            }
        });
    }

    // 店舗カードのクリックイベント（今日更新）
    const todayContainer = document.getElementById('today-flyers-container');
    if (todayContainer) {
        attachStoreCardEvents(todayContainer, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }
}