import { getGenres } from '../services/dataService.js';
import { GenreCard, attachGenreCardEvents } from '../components/GenreCard.js';
import { debounce } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * ジャンル選択ページを描画（分離版）
 * HTMLは外部テンプレート、CSSはカスタムクラスを使用
 * 
 * @param {Object|null} userLocation - ユーザーの位置情報 {lat, lng} または null
 * @returns {Promise<string>} HTML文字列
 */
export async function GenrePage(userLocation) {
    const genres = await getGenres();
    const genresHTMLPromises = genres.map(async genre => await GenreCard(genre));
    const genresHTML = (await Promise.all(genresHTMLPromises)).join('');

    // テンプレートデータを準備
    const templateData = {
        genresHTML: genresHTML,
        noGenres: genres.length === 0
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/pages/genre-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        // フォールバック: インラインHTML（既存の方法）
        return getGenrePageHTMLFallback(genresHTML, genres.length);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getGenrePageHTMLFallback(genresHTML, genresCount) {
    return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <button id="back-button" class="btn-back">
          <span class="text-lg">←</span>
          <span>戻る</span>
        </button>
        <h1 class="text-3xl font-bold text-gray-800">商品から探す</h1>
      </div>
      <div class="info-box blue">
        <p>商品名で検索するか、ジャンルを選択してください。位置情報から5km圏内の商品を安い順で表示します。</p>
      </div>
      <div class="relative">
        <input type="text" id="product-search-input" placeholder="商品名を入力して検索（例: 牛肉、りんご、トマト）..." class="search-input" />
        <span class="absolute left-4 top-4 text-2xl">🔍</span>
        <button id="search-button" class="btn-search absolute right-2 top-2">検索</button>
      </div>
      <div class="text-center">
        <div class="relative">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div>
          <div class="relative flex justify-center text-sm"><span class="px-2 bg-gray-50 text-gray-500">または</span></div>
        </div>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800 mb-4">ジャンルから選ぶ</h2>
        <div id="genres-container" class="grid grid-cols-2 md:grid-cols-4 gap-4">${genresHTML}</div>
      </div>
      ${genresCount === 0 ? `<div class="empty-state"><div class="empty-icon">📦</div><p class="empty-text">ジャンルが見つかりませんでした</p></div>` : ''}
    </div>
  `;
}

/**
 * ジャンル選択ページのイベントを設定
 */
export function attachGenrePageEvents() {
    // 戻るボタン
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    // 検索実行関数
    const executeSearch = async (query) => {
        if (!query || query.trim().length === 0) {
            return;
        }

        try {
            // URLから位置情報を取得（なければ取得）
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
            let lat = urlParams.get('lat');
            let lng = urlParams.get('lng');
            
            if (!lat || !lng) {
                const { requestUserLocation } = await import('../utils/location.js');
                const userLocation = await requestUserLocation();
                lat = userLocation.lat;
                lng = userLocation.lng;
            }
            
            window.location.hash = `/search?q=${encodeURIComponent(query.trim())}&lat=${lat}&lng=${lng}&maxDistance=5&sortBy=price-asc`;
        } catch (error) {
            alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
        }
    };

    // 商品名検索のデバウンス処理
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
        const handleSearch = debounce(async (query) => {
            await executeSearch(query);
        }, 300);

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        // Enterキーでも検索
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await executeSearch(searchInput.value);
            }
        });
    }

    // 検索ボタン
    const searchButton = document.getElementById('search-button');
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', async () => {
            await executeSearch(searchInput.value);
        });
    }

    // ジャンルカードのクリックイベント
    const genresContainer = document.getElementById('genres-container');
    if (genresContainer) {
        attachGenreCardEvents(genresContainer, async (genreId) => {
            // URLから位置情報を取得（なければ取得）
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
            let lat = urlParams.get('lat');
            let lng = urlParams.get('lng');
            
            if (!lat || !lng) {
                try {
                    const { requestUserLocation } = await import('../utils/location.js');
                    const userLocation = await requestUserLocation();
                    lat = userLocation.lat;
                    lng = userLocation.lng;
                } catch (error) {
                    alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
                    return;
                }
            }
            
            window.location.hash = `/genre/${genreId}/stores?lat=${lat}&lng=${lng}`;
        });
    }
}

