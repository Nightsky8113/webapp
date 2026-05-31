import { loadAndRenderTemplate } from '../utils/template.js';
import { deleteAllStores } from '../services/dataService.js';

/**
 * 使い方ページのコンテンツを生成する
 */
export async function HowToUsePage() {
    try {
        return await loadAndRenderTemplate('/templates/pages/how-to-use-page.html', {});
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getHowToUsePageHTMLFallback();
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getHowToUsePageHTMLFallback() {
    return `
    <div class="how-to-use-page">
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <button id="back-button" class="btn-back">
            <span class="text-lg">←</span>
            <span>戻る</span>
          </button>
          <h1 class="page-title">使い方</h1>
        </div>

        <div class="content-card">
          <div class="space-y-6 text-gray-700">
            <ol class="list-decimal list-inside space-y-4 pl-4">
              <li class="space-y-2">
                <span class="font-semibold text-gray-900">位置情報から探すをクリック</span>
                <ul class="list-disc list-inside ml-6 space-y-1 text-gray-600">
                  <li>これにより近くの6店舗がDBに保存されます。</li>
                </ul>
              </li>
              
              <li class="space-y-2">
                <span class="font-semibold text-gray-900">画面右上のアップロードをクリック</span>
              </li>
              
              <li class="space-y-2">
                <span class="font-semibold text-gray-900">画面に従ってチラシ画像をスキャン、アップロード</span>
                <ul class="list-disc list-inside ml-6 space-y-1 text-gray-600">
                  <li>
                    ダミーチラシが必要な場合は
                    <a 
                      href="https://drive.google.com/drive/folders/1RDwi6eWSzPTYtGoTjqdWlAFTYaBeaLQ-" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:text-blue-800 underline"
                    >
                      こちら
                    </a>
                  </li>
                </ul>
              </li>
            </ol>

            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
              <p class="text-sm text-gray-700">
                ※短時間に大量のOCRリクエストを行うと制限がかかる場合があります。その場合数分待つことで再度OCRが使用できるようになります。
              </p>
            </div>

            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
              <p class="text-sm text-gray-700">
                このプロジェクトはgoogle apiなどのサービスの無料枠を使用しており、コストの削減の面、またチラシは著作権の問題があるので、チラシの自動取得などは実装していません。
              </p>
            </div>

            <!-- 管理者向け: データベース全削除ボタン -->
            <div class="bg-red-50 border-l-4 border-red-400 p-4 my-6">
              <h3 class="font-bold text-red-800 mb-2">⚠️ 管理者向け機能</h3>
              <p class="text-sm text-gray-700 mb-3">
                storesテーブル内のすべてのデータを削除します（関連するチラシ、商品データも削除されます）。この操作は取り消せません。
              </p>
              <button 
                id="delete-all-stores-button"
                class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                すべての店舗データを削除
              </button>
              <div id="delete-status" class="mt-2 text-sm hidden"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 使い方ページに必要なイベントハンドラーを設定する
 */
export function attachHowToUsePageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    const deleteAllStoresButton = document.getElementById('delete-all-stores-button');
    const deleteStatus = document.getElementById('delete-status');
    
    if (deleteAllStoresButton) {
        deleteAllStoresButton.addEventListener('click', async () => {
            // 確認ダイアログを表示
            const confirmMessage = '⚠️ 警告: すべての店舗データを削除しますか？\n\n' +
                'この操作により以下が削除されます:\n' +
                '- すべての店舗情報\n' +
                '- すべてのチラシデータ\n' +
                '- すべての商品データ\n' +
                '- すべてのお気に入りデータ\n\n' +
                'この操作は取り消せません。本当に実行しますか？\n\n' +
                '実行する場合は「削除」と入力してください。';
            
            const userInput = prompt(confirmMessage);
            
            if (userInput !== '削除') {
                if (deleteStatus) {
                    deleteStatus.textContent = '削除がキャンセルされました。';
                    deleteStatus.className = 'mt-2 text-sm text-gray-600';
                    deleteStatus.classList.remove('hidden');
                    setTimeout(() => {
                        deleteStatus.classList.add('hidden');
                    }, 3000);
                }
                return;
            }

            // ボタンを無効化
            deleteAllStoresButton.disabled = true;
            deleteAllStoresButton.textContent = '削除中...';
            
            if (deleteStatus) {
                deleteStatus.textContent = '削除処理を実行中...';
                deleteStatus.className = 'mt-2 text-sm text-blue-600';
                deleteStatus.classList.remove('hidden');
            }

            try {
                console.log('削除処理を開始します...');
                const result = await deleteAllStores();
                console.log('削除結果:', result);
                
                if (result.success) {
                    if (deleteStatus) {
                        deleteStatus.textContent = `✅ 削除完了: ${result.deletedCount || 0}件の店舗データを削除しました。`;
                        deleteStatus.className = 'mt-2 text-sm text-green-600';
                        deleteStatus.classList.remove('hidden');
                    }
                    deleteAllStoresButton.textContent = '削除完了';
                    deleteAllStoresButton.classList.remove('bg-red-600', 'hover:bg-red-700');
                    deleteAllStoresButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                    
                    // 3秒後にページをリロードして最新状態を表示
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    const errorMessage = result.error || '不明なエラーが発生しました';
                    console.error('削除失敗:', errorMessage);
                    
                    if (deleteStatus) {
                        deleteStatus.textContent = `❌ 削除失敗: ${errorMessage}\n\n詳細はブラウザのコンソール（F12）を確認してください。`;
                        deleteStatus.className = 'mt-2 text-sm text-red-600 whitespace-pre-line';
                        deleteStatus.classList.remove('hidden');
                    }
                    deleteAllStoresButton.disabled = false;
                    deleteAllStoresButton.textContent = 'すべての店舗データを削除';
                }
            } catch (error) {
                console.error('店舗削除エラー:', error);
                console.error('エラースタック:', error.stack);
                
                if (deleteStatus) {
                    deleteStatus.textContent = `❌ エラー: ${error.message || '予期しないエラーが発生しました'}\n\n詳細はブラウザのコンソール（F12）を確認してください。`;
                    deleteStatus.className = 'mt-2 text-sm text-red-600 whitespace-pre-line';
                    deleteStatus.classList.remove('hidden');
                }
                deleteAllStoresButton.disabled = false;
                deleteAllStoresButton.textContent = 'すべての店舗データを削除';
            }
        });
    }
}

