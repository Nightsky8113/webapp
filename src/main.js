// 診断用: main.jsが読み込まれたことを確認
console.log('✅ main.jsが読み込まれました');

import { initRouter } from './router.js';
import { getDefaultLocation } from './utils/location.js';
import { initImageModal } from './utils/imageModal.js';
import 'virtual:uno.css';
// CSSファイルはindex.htmlから直接読み込む（CSS分離後の問題を回避）
// import './styles/components.css';
// import './styles/pages.css';
// import './styles/image-modal.css';

/**
 * アプリケーション全体を初期化し、ルーティングとグローバルエラーハンドリングを設定する
 * 位置情報は明示的にユーザーが検索方法を選択するまで取得しない
 */
async function initApp() {
    console.log('🚀 アプリを初期化中...');

    // タイムアウトを設定して、フリーズを防止
    const timeoutId = setTimeout(() => {
        console.error('⚠️ アプリの初期化がタイムアウトしました');
        const appContainer = document.getElementById('app');
        if (appContainer && appContainer.innerHTML.includes('読み込み中')) {
            appContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-gray-500 text-lg mb-4">アプリの初期化に時間がかかっています</p>
                    <p class="text-gray-400 text-sm mb-4">環境変数が設定されているか、コンソールでエラーを確認してください</p>
                    <button 
                        id="reload-button-timeout"
                        class="btn-primary"
                    >
                        再読み込み
                    </button>
                </div>
            `;
            // イベントリスナーを追加
            const reloadButton = document.getElementById('reload-button-timeout');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    }, 10000); // 10秒でタイムアウト

    try {
        const defaultLocation = getDefaultLocation();
        console.log('✅ デフォルト位置情報取得完了:', defaultLocation);

        // 画像拡大モーダルを初期化（jQuery/Lightbox2の代わり）
        try {
            initImageModal();
            console.log('✅ 画像拡大モーダル初期化完了');
        } catch (error) {
            console.error('⚠️ 画像拡大モーダル初期化エラー:', error);
            // 画像拡大機能は必須ではないので、エラーでも続行
        }

        // クライアントサイドルーティングを開始（位置情報は後で取得）
        try {
            initRouter(null);
            console.log('✅ ルーター初期化完了');
        } catch (error) {
            console.error('❌ ルーター初期化エラー:', error);
            throw error; // ルーターは必須なので、エラー時は処理を中断
        }

        // URLにハッシュがない場合、デフォルトでホームページを表示
        if (!window.location.hash) {
            window.location.hash = '/home';
        }

        clearTimeout(timeoutId);
        console.log('✅ アプリの初期化完了');
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ アプリの初期化に失敗:', error);
        console.error('エラー詳細:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // 初期化失敗時にユーザーに再読み込みを促すUIを表示
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">❌</div>
                    <p class="text-gray-500 text-lg mb-4">アプリの起動に失敗しました</p>
                    <p class="text-gray-400 text-sm mb-4">${error.message || '不明なエラーが発生しました'}</p>
                    <button 
                        id="reload-button-error"
                        class="btn-primary"
                    >
                        再読み込み
                    </button>
                </div>
            `;
            // イベントリスナーを追加
            const reloadButton = document.getElementById('reload-button-error');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
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
    console.error('グローバルエラー:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
    });
    
    // Vercel上でエラーが発生している場合、ユーザーに表示
    if (window.location.hostname.includes('vercel.app')) {
        const appContainer = document.getElementById('app');
        if (appContainer && appContainer.innerHTML.includes('読み込み中')) {
            appContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-gray-500 text-lg mb-4">エラーが発生しました</p>
                    <p class="text-gray-400 text-sm mb-4">コンソールで詳細を確認してください</p>
                    <button 
                        id="reload-button-global-error"
                        class="btn-primary"
                    >
                        再読み込み
                    </button>
                </div>
            `;
            // イベントリスナーを追加
            const reloadButton = document.getElementById('reload-button-global-error');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    }
});

// 未処理のPromise拒否をログに記録（非同期処理のエラー検知）
window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', {
        reason: event.reason,
        message: event.reason?.message,
        stack: event.reason?.stack
    });
    
    // Vercel上でエラーが発生している場合、ユーザーに表示
    if (window.location.hostname.includes('vercel.app')) {
        const appContainer = document.getElementById('app');
        if (appContainer && appContainer.innerHTML.includes('読み込み中')) {
            appContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">⚠️</div>
                    <p class="text-gray-500 text-lg mb-4">非同期処理でエラーが発生しました</p>
                    <p class="text-gray-400 text-sm mb-4">${event.reason?.message || '不明なエラー'}</p>
                    <button 
                        id="reload-button-promise-error"
                        class="btn-primary"
                    >
                        再読み込み
                    </button>
                </div>
            `;
            // イベントリスナーを追加
            const reloadButton = document.getElementById('reload-button-promise-error');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    }
});