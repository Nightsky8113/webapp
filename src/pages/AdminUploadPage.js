import { getStores } from '../services/dataService.js';
import { uploadAndSaveFlyer } from '../services/storageService.js';
import { escapeHtml } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { processFlyerOCR } from '../services/ocrService.js';

/**
 * 管理者向けチラシ画像アップロードページのコンテンツを生成する
 * 店舗選択と画像ファイル選択のフォームを提供し、Supabase Storageへのアップロード機能を実現する
 */
export async function AdminUploadPage() {
    const stores = await getStores();
    
    // 店舗選択オプションのHTMLを生成
    const storeOptionsHTML = stores.map(store => {
        const storeName = escapeHtml(store.name);
        return `<option value="${store.id}">${storeName}</option>`;
    }).join('');

    const templateData = {
        hasStores: stores.length > 0,
        noStores: stores.length === 0,
        storeOptionsHTML: storeOptionsHTML,
        storesCount: stores.length
    };

    try {
        return await loadAndRenderTemplate('/templates/pages/admin-upload-page.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return getAdminUploadPageHTMLFallback(storeOptionsHTML, stores.length);
    }
}

/**
 * フォールバック用HTML（テンプレート読み込み失敗時）
 */
function getAdminUploadPageHTMLFallback(storeOptionsHTML, storesCount) {
    if (storesCount === 0) {
        return `
        <div class="admin-upload-page">
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <p class="empty-text">店舗が登録されていません</p>
            <button id="back-button" class="btn-primary mt-4">ホームに戻る</button>
          </div>
        </div>
      `;
    }

    return `
    <div class="admin-upload-page">
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <button id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
          <h1 class="text-3xl font-bold text-gray-800">チラシ画像アップロード</h1>
        </div>

        <div class="upload-form-card">
          <form id="upload-form">
            <div class="form-group">
              <label for="store-select" class="form-label">店舗を選択</label>
              <select id="store-select" name="storeId" class="form-select" required>
                <option value="">-- 店舗を選択してください --</option>
                ${storeOptionsHTML}
              </select>
            </div>

            <div class="form-group">
              <label for="file-input" class="form-label">画像ファイルを選択</label>
              <input 
                type="file" 
                id="file-input" 
                name="file" 
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" 
                class="form-file-input"
                required
              />
              <p class="form-help">対応形式: JPEG, PNG, WebP, GIF / 最大サイズ: 50MB</p>
            </div>

            <div id="preview-area" class="preview-area hidden"></div>

            <div id="upload-status" class="upload-status hidden"></div>

            <button type="submit" id="upload-button" class="btn-primary w-full mt-6">
              アップロード
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * 管理者アップロードページに必要なイベントハンドラーを設定する
 * ファイル選択時のプレビュー表示とフォーム送信時のアップロード処理を設定する
 */
export async function attachAdminUploadPageEvents() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '/home';
        });
    }

    // 店舗検索・予測変換機能の初期化
    await initStoreSearch();

    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');
    const previewArea = document.getElementById('preview-area');
    const uploadStatus = document.getElementById('upload-status');
    const uploadButton = document.getElementById('upload-button');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && previewArea) {
                showPreview(file, previewArea);
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const storeSelect = document.getElementById('store-select');
            const fileInput = document.getElementById('file-input');

            if (!storeSelect || !fileInput || !fileInput.files[0]) {
                showStatus(uploadStatus, 'エラー: 店舗とファイルを選択してください。', 'error');
                return;
            }

            const storeId = parseInt(storeSelect.value);
            
            if (!storeId) {
                showStatus(uploadStatus, 'エラー: 店舗を選択してください。', 'error');
                return;
            }
            const file = fileInput.files[0];

            if (!storeId) {
                showStatus(uploadStatus, 'エラー: 店舗を選択してください。', 'error');
                return;
            }

            if (uploadButton) {
                uploadButton.disabled = true;
                uploadButton.textContent = 'アップロード中...';
            }

            showStatus(uploadStatus, 'アップロード中...', 'loading');

            try {
                const result = await uploadAndSaveFlyer(file, storeId, {
                    is_latest: true,
                    ocr_done: false
                });

                if (result.success) {
                    showStatus(uploadStatus, `✅ アップロード成功！チラシID: ${result.flyer.id}`, 'success');
                    
                    // OCR処理を実行（オプション）
                    const enableOCR = document.getElementById('enable-ocr');
                    if (enableOCR && enableOCR.checked) {
                        showStatus(uploadStatus, '🔄 OCR処理を実行中...（1-2分かかる場合があります）', 'loading');
                        
                        // OCR処理を非同期で実行
                        processFlyerOCR(result.imageUrl, result.flyer.id, storeId)
                            .then(ocrResult => {
                                if (ocrResult.success) {
                                    const itemsCount = ocrResult.items?.length || 0;
                                    if (itemsCount > 0) {
                                        showStatus(uploadStatus, `✅ OCR処理完了！商品情報を${itemsCount}件抽出しました。`, 'success');
                                    } else {
                                        showStatus(uploadStatus, `⚠️ OCR処理は完了しましたが、商品情報を抽出できませんでした。`, 'error');
                                    }
                                    
                                    setTimeout(() => {
                                        if (uploadStatus) {
                                            uploadStatus.classList.add('hidden');
                                        }
                                    }, 8000);
                                } else {
                                    // エラーメッセージを改行で分割して表示
                                    const errorMessage = ocrResult.error || '不明なエラー';
                                    const errorLines = errorMessage.split('\n');
                                    const shortError = errorLines[0] + (errorLines.length > 1 ? '...' : '');
                                    showStatus(uploadStatus, `⚠️ OCR処理に失敗しました: ${shortError}`, 'error');
                                    setTimeout(() => {
                                        if (uploadStatus) {
                                            uploadStatus.classList.add('hidden');
                                        }
                                    }, 10000);
                                }
                            })
                            .catch(error => {
                                console.error('OCR処理エラー:', error);
                                showStatus(uploadStatus, `⚠️ OCR処理中にエラーが発生しました: ${error.message}`, 'error');
                                setTimeout(() => {
                                    if (uploadStatus) {
                                        uploadStatus.classList.add('hidden');
                                    }
                                }, 10000);
                            });
                    } else {
                        setTimeout(() => {
                            if (uploadStatus) {
                                uploadStatus.classList.add('hidden');
                            }
                        }, 3000);
                    }
                    
                    uploadForm.reset();
                    if (previewArea) {
                        previewArea.classList.add('hidden');
                        previewArea.innerHTML = '';
                    }
                } else {
                    showStatus(uploadStatus, `❌ エラー: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('アップロードエラー:', error);
                showStatus(uploadStatus, `❌ 予期しないエラーが発生しました: ${error.message}`, 'error');
            } finally {
                if (uploadButton) {
                    uploadButton.disabled = false;
                    uploadButton.textContent = 'アップロード';
                }
            }
        });
    }
}

/**
 * 選択された画像ファイルのプレビューを表示する
 * FileReaderを使用してファイルを読み込み、プレビューエリアに画像とメタ情報を表示する
 */
function showPreview(file, previewArea) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewArea.innerHTML = `
            <div class="preview-container">
                <p class="preview-label">プレビュー:</p>
                <img src="${e.target.result}" alt="プレビュー" class="preview-image" />
                <p class="preview-info">ファイル名: ${escapeHtml(file.name)}</p>
                <p class="preview-info">ファイルサイズ: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
        `;
        previewArea.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

/**
 * アップロード処理のステータスメッセージを表示する
 * 成功・失敗・読み込み中の状態に応じて適切な色とスタイルを適用する
 */
function showStatus(statusElement, message, type) {
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `upload-status ${type}`;
    statusElement.classList.remove('hidden');

    if (type === 'error') {
        statusElement.style.color = '#dc2626';
        statusElement.style.backgroundColor = '#fee2e2';
    } else if (type === 'success') {
        statusElement.style.color = '#16a34a';
        statusElement.style.backgroundColor = '#dcfce7';
    } else if (type === 'loading') {
        statusElement.style.color = '#2563eb';
        statusElement.style.backgroundColor = '#dbeafe';
    }
}

