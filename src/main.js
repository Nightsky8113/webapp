import { initRouter } from './router.js';
import { getFromLocalStorage, saveToLocalStorage } from './utils/helpers.js';
import 'virtual:uno.css';

/**
 * ユーザーの位置情報を取得
 * @returns {Promise<Object>} {lat, lng}
 */
async function getUserLocation() {
    // LocalStorageから取得を試みる
    const cachedLocation = getFromLocalStorage('userLocation');
    if (cachedLocation) {
        console.log('キャッシュされた位置情報を使用:', cachedLocation);
        return cachedLocation;
    }

    // Geolocation APIで取得を試みる
    if ('geolocation' in navigator) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 600000 // 10分間キャッシュ
                });
            });

            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // LocalStorageに保存
            saveToLocalStorage('userLocation', location);
            console.log('現在地を取得:', location);

            return location;
        } catch (error) {
            console.warn('位置情報の取得に失敗:', error.message);
        }
    }

    // デフォルト位置（東京駅周辺）
    const defaultLocation = { lat: 35.6812, lng: 139.7671 };
    console.log('デフォルト位置を使用:', defaultLocation);
    return defaultLocation;
}

/**
 * アプリ初期化
 */
async function initApp() {
    console.log('🚀 アプリを初期化中...');

    try {
        // ユーザー位置情報を取得
        const userLocation = await getUserLocation();

        // ルーターを初期化
        initRouter(userLocation);

        // ハッシュがない場合はホームへ
        if (!window.location.hash) {
            window.location.hash = '/home';
        }

        console.log('✅ アプリの初期化完了');
    } catch (error) {
        console.error('❌ アプリの初期化に失敗:', error);

        // エラー表示
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">❌</div>
          <p class="text-gray-500 text-lg mb-4">アプリの起動に失敗しました</p>
          <button 
            onclick="window.location.reload()"
            class="btn-primary"
          >
            再読み込み
          </button>
        </div>
      `;
        }
    }
}

// DOMの読み込み完了後にアプリを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// エラーハンドリング（グローバル）
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
});