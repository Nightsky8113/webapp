import { initRouter } from './router.js';
import { getDefaultLocation } from './utils/location.js';
import 'virtual:uno.css';
import './styles/components.css';
import './styles/pages.css';

/**
 * アプリケーション全体を初期化し、ルーティングとグローバルエラーハンドリングを設定する
 * 位置情報は明示的にユーザーが検索方法を選択するまで取得しない
 */
async function initApp() {
    console.log('🚀 アプリを初期化中...');

    try {
        const defaultLocation = getDefaultLocation();

        // クライアントサイドルーティングを開始（位置情報は後で取得）
        initRouter(null);

        // URLにハッシュがない場合、デフォルトでホームページを表示
        if (!window.location.hash) {
            window.location.hash = '/home';
        }

        console.log('✅ アプリの初期化完了');
    } catch (error) {
        console.error('❌ アプリの初期化に失敗:', error);

        // 初期化失敗時にユーザーに再読み込みを促すUIを表示
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

// DOM読み込み完了後にアプリを初期化（既に読み込み済みの場合は即座に実行）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// アプリケーション全体でキャッチできなかったエラーをログに記録
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
});

// 未処理のPromise拒否をログに記録（非同期処理のエラー検知）
window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
});