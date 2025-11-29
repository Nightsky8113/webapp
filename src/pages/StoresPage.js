import { getStores, getFlyers } from '../services/dataService.js';
import { sortByDistance } from '../utils/distance.js';
import { StoreCard, attachStoreCardEvents } from '../components/StoreCard.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * 店舗一覧ページを描画（距離順、最大6件）（分離版）
 * HTMLは外部テンプレート、CSSはカスタムクラスを使用
 * 
 * @param {Object} userLocation - ユーザーの位置情報 {lat, lng}
 * @returns {Promise<string>} HTML文字列
 */
export async function StoresPage(userLocation) {
    const stores = await getStores();
    const flyers = await getFlyers();

    // 位置情報がない場合はエラー表示
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        const templateData = {
            needsLocation: true,
            hasContent: false
        };
        try {
            return await loadAndRenderTemplate('/src/templates/pages/stores-page.html', templateData);
        } catch (error) {
            return `
            <div class="empty-state">
              <div class="empty-icon">📍</div>
              <p class="empty-text">位置情報が必要です</p>
              <button id="back-button" class="btn-primary mt-4">戻る</button>
            </div>
          `;
        }
    }

    // 距離順にソート（最大6件）
    const storesWithDistance = sortByDistance(stores, userLocation).slice(0, 6);

    const storesHTMLPromises = storesWithDistance.map(async store => {
        const flyer = flyers.find(f => f.store_id === store.id && f.is_latest);
        return await StoreCard(store, flyer, store.distance);
    });
    const storesHTML = (await Promise.all(storesHTMLPromises)).join('');

    // テンプレートデータを準備
    const templateData = {
        needsLocation: false,
        hasContent: true,
        storesHTML: storesHTML,
        noStores: storesWithDistance.length === 0
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/stores-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getStoresPageHTMLFallback(storesHTML, storesWithDistance.length);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getStoresPageHTMLFallback(storesHTML, storesCount) {
    return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="text-3xl font-bold text-gray-800">近くの店舗（距離順）</h1>
      </div>
      <div class="info-box green">
        <p>📍 現在地から近い順に最大6件の店舗を表示しています</p>
      </div>
      <div id="stores-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${storesHTML}</div>
      ${storesCount === 0 ? `<div class="empty-state"><div class="empty-icon">🏪</div><p class="empty-text">近くに店舗が見つかりませんでした</p></div>` : ''}
    </div>
  `;
}

/**
 * 店舗一覧ページのイベントを設定
 */
export function attachStoresPageEvents() {
    // 戻るボタン
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    // 店舗カードのクリックイベント
    const container = document.getElementById('stores-container');
    if (container) {
        attachStoreCardEvents(container, (storeId) => {
            window.location.hash = `/store/${storeId}`;
        });
    }
}