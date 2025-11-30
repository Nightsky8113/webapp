import { getFlyers, getTodayFlyers } from '../services/dataService.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * ホームページのコンテンツを生成する
 * 検索方法選択UIと本日更新されたチラシの店舗一覧を表示する
 * テンプレートファイルを使用してHTMLを生成し、読み込み失敗時はフォールバックHTMLを返す
 */
export async function HomePage(userLocation) {
    console.log('🏠 HomePage開始', { userLocation });
    
    try {
        console.log('📊 今日のチラシを取得中...');
        const todayFlyers = await getTodayFlyers();
        console.log('✅ 今日のチラシを取得しました', { count: todayFlyers.length });
        
        console.log('📊 店舗データを取得中...');
        const { getStores } = await import('../services/dataService.js');
        const allStores = await getStores();
        console.log('✅ 店舗データを取得しました', { count: allStores.length });
        
        const storeIds = [...new Set(todayFlyers.map(f => f.store_id))];
        const todayStores = allStores.filter(s => storeIds.includes(s.id));
        console.log('📋 今日のチラシの店舗をフィルタリングしました', { count: todayStores.length });

        console.log('🃏 店舗カードを生成中...');
        const todayStoresHTMLPromises = todayFlyers.map(async flyer => {
            const store = todayStores.find(s => s.id === flyer.store_id);
            if (!store) return '';
            return await StoreCard(store, flyer, undefined);
        });
        const todayStoresHTML = (await Promise.all(todayStoresHTMLPromises)).join('');
        console.log('✅ 店舗カードを生成しました', { htmlLength: todayStoresHTML.length });

        const templateData = {
            hasTodayFlyers: todayFlyers.length > 0,
            noTodayFlyers: todayFlyers.length === 0,
            todayStoresHTML: todayStoresHTML
        };
        console.log('📝 テンプレートデータを準備しました', templateData);

        console.log('📄 テンプレートを読み込み中...');
        try {
            const html = await loadAndRenderTemplate('/src/templates/pages/home-page.html', templateData);
            console.log('✅ テンプレートからHTMLを生成しました', { htmlLength: html?.length || 0 });
            return html;
        } catch (error) {
            console.error('❌ テンプレート読み込み失敗:', error);
            console.warn('⚠️ フォールバックHTMLを使用します');
            const fallbackHtml = getHomePageHTMLFallback(todayFlyers, todayStoresHTML);
            console.log('✅ フォールバックHTMLを生成しました', { htmlLength: fallbackHtml?.length || 0 });
            return fallbackHtml;
        }
    } catch (error) {
        console.error('❌ HomePageでエラーが発生しました:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * テンプレート読み込み失敗時に使用するフォールバックHTMLを生成する
 * テンプレート機能が利用できない場合でもページが表示できるようにする
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
 * ホームページに必要なイベントハンドラーを設定する
 * 検索方法選択ボタンと店舗カードのクリックイベントを設定する
 */
export function attachHomePageEvents() {
    const searchByProduct = document.getElementById('search-by-product');
    if (searchByProduct) {
        searchByProduct.addEventListener('click', async () => {
            try {
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                window.location.hash = `/genre?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            } catch (error) {
                alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
            }
        });
    }

    const searchByLocation = document.getElementById('search-by-location');
    if (searchByLocation) {
        searchByLocation.addEventListener('click', async () => {
            try {
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                window.location.hash = `/stores?lat=${userLocation.lat}&lng=${userLocation.lng}`;
            } catch (error) {
                alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
            }
        });
    }

    const todayContainer = document.getElementById('today-flyers-container');
    if (todayContainer) {
        attachStoreCardEvents(todayContainer, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }
}