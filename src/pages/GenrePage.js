import { getGenres } from '../services/dataService.js';
import { GenreCard, attachGenreCardEvents } from '../components/GenreCard.js';
import { debounce } from '../utils/helpers.js';

/**
 * ジャンル選択ページを描画
 * @param {Object|null} userLocation - ユーザーの位置情報 {lat, lng} または null
 * @returns {Promise<string>} HTML文字列
 */
export async function GenrePage(userLocation) {
    const genres = await getGenres();
    const genresHTML = genres.map(genre => GenreCard(genre)).join('');

    return `
    <div class="space-y-6">
      <!-- ヘッダー -->
      <div class="flex items-center gap-4">
        <button 
          id="back-button"
          class="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
        >
          ← 戻る
        </button>
        <h1 class="text-3xl font-bold text-gray-800">商品から探す</h1>
      </div>
      
      <!-- 説明 -->
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p class="text-blue-800">
          商品名で検索するか、ジャンルを選択してください。位置情報から5km圏内の商品を安い順で表示します。
        </p>
      </div>
      
      <!-- 商品名検索 -->
      <div class="relative">
        <input
          type="text"
          id="product-search-input"
          placeholder="商品名で検索..."
          class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
        <span class="absolute left-4 top-4 text-2xl">🔍</span>
      </div>

      <!-- または -->
      <div class="text-center">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">または</span>
          </div>
        </div>
      </div>
      
      <!-- ジャンル一覧 -->
      <div>
        <h2 class="text-xl font-bold text-gray-800 mb-4">ジャンルから選ぶ</h2>
        <div 
          id="genres-container" 
          class="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          ${genresHTML}
        </div>
      </div>
      
      ${genres.length === 0 ? `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📦</div>
          <p class="text-gray-500 text-lg">ジャンルが見つかりませんでした</p>
        </div>
      ` : ''}
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

    // 商品名検索のデバウンス処理
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
        const handleSearch = debounce(async (query) => {
            if (query.trim().length > 0) {
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
                    
                    window.location.hash = `/search?q=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}&maxDistance=5&sortBy=price-asc`;
                } catch (error) {
                    alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
                }
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        // Enterキーでも検索
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && searchInput.value.trim().length > 0) {
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
                    
                    window.location.hash = `/search?q=${encodeURIComponent(searchInput.value)}&lat=${lat}&lng=${lng}&maxDistance=5&sortBy=price-asc`;
                } catch (error) {
                    alert('位置情報の取得に失敗しました。位置情報の許可をお願いします。');
                }
            }
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

