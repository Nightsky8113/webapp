import { initRouter } from './router.js';
import { getDefaultLocation } from './utils/location.js';
import 'virtual:uno.css';

/**
 * アプリ初期化
 */
async function initApp() {
    console.log('🚀 アプリを初期化中...');

    try {
        // 位置情報は初期化時には取得しない（ユーザーが選択後に取得）
        // デフォルト位置を設定（必要に応じて使用）
        const defaultLocation = getDefaultLocation();

        // ルーターを初期化（位置情報はnullで開始）
        initRouter(null);

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