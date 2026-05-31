import { getStores } from '../services/dataService.js';
import { escapeHtml } from '../utils/helpers.js';
import { submitFlyerUpload } from '../utils/flyerUploadSubmit.js';
import { loadAndRenderTemplate } from '../utils/template.js';
import { showImagePreview, showUploadStatus } from '../utils/uploadUi.js';

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
        return await loadAndRenderTemplate('/src/templates/pages/admin-upload-page.html', templateData);
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

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="enable-ocr" name="enableOCR" />
                <span class="ml-2">OCR処理を実行する（商品情報を自動抽出）</span>
              </label>
              <p class="form-help">チェックすると画像から商品情報を抽出します（1〜2分かかる場合があります）</p>
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

    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');
    const previewArea = document.getElementById('preview-area');
    const uploadStatus = document.getElementById('upload-status');
    const uploadButton = document.getElementById('upload-button');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && previewArea) {
                showImagePreview(file, previewArea);
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const storeSelect = document.getElementById('store-select');
            const fileInput = document.getElementById('file-input');

            if (!storeSelect || !fileInput || !fileInput.files[0]) {
                showUploadStatus(uploadStatus, 'エラー: 店舗とファイルを選択してください。', 'error');
                return;
            }

            const storeId = parseInt(storeSelect.value);
            const file = fileInput.files[0];

            if (!storeId) {
                showUploadStatus(uploadStatus, 'エラー: 店舗を選択してください。', 'error');
                return;
            }

            const enableOcr = document.getElementById('enable-ocr')?.checked === true;

            await submitFlyerUpload({
                file,
                storeId,
                enableOcr,
                uploadStatus,
                uploadButton,
                uploadForm,
                previewArea
            });
        });
    }
}

