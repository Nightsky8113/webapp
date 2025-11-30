import { initRouter } from './router.js';
import { getDefaultLocation } from './utils/location.js';
import { initImageModal } from './utils/imageModal.js';
import 'virtual:uno.css';

/**
 * アプリ初期化
 */
async function initApp() {
    try {
        // 位置情報は初期化時には取得しない（ユーザーが選択後に取得）
        // デフォルト位置を設定（必要に応じて使用）
        const defaultLocation = getDefaultLocation();

        // 画像拡大モーダルを初期化
        try {
            initImageModal();
        } catch (error) {
            console.error('⚠️ 画像拡大モーダル初期化エラー:', error);
            // 画像拡大機能は必須ではないので、エラーでも続行
        }

        // ルーターを初期化（位置情報はnullで開始）
        initRouter(null);

        // ハッシュがない場合はホームへ
        if (!window.location.hash) {
            window.location.hash = '/home';
        }
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
            id="reload-button-init-error"
            class="btn-primary"
          >
            再読み込み
          </button>
        </div>
      `;
            // イベントリスナーを追加
            const reloadButton = document.getElementById('reload-button-init-error');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
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