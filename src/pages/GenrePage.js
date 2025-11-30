import { getGenres } from '../services/dataService.js';
import { GenreCard, attachGenreCardEvents } from '../components/GenreCard.js';
import { debounce } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * ジャンル選択ページのコンテンツを生成する
 * 商品検索機能とジャンル一覧を表示し、ユーザーが商品検索またはジャンル選択を行えるようにする
 */
export async function GenrePage(userLocation) {
    const genres = await getGenres();
    const genresHTMLPromises = genres.map(async genre => await GenreCard(genre));
    const genresHTML = (await Promise.all(genresHTMLPromises)).join('');

    const templateData = {
        genresHTML: genresHTML,
        noGenres: genres.length === 0
    };

    try {
        return await loadAndRenderTemplate('/templates/pages/genre-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getGenrePageHTMLFallback(genresHTML, genres.length);
    }
}

/**
 * テンプレート読み込み失敗時に使用するフォールバックHTMLを生成する
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
 * ジャンル選択ページに必要なイベントハンドラーを設定する
 * 戻るボタン、商品検索入力、検索ボタン、ジャンルカードのクリックイベントを設定する
 * 商品検索は入力中の連続リクエストを防ぐためデバウンス処理を適用する
 */
export function attachGenrePageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    const executeSearch = async (query) => {
        if (!query || query.trim().length === 0) {
            return;
        }

        try {
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

    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
        const handleSearch = debounce(async (query) => {
            await executeSearch(query);
        }, 300);

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await executeSearch(searchInput.value);
            }
        });
    }

    const searchButton = document.getElementById('search-button');
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', async () => {
            await executeSearch(searchInput.value);
        });
    }

    const genresContainer = document.getElementById('genres-container');
    if (genresContainer) {
        attachGenreCardEvents(genresContainer, async (genreId) => {
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

