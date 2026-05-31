import { getStoreAccount, getAuthRequiredHTML, attachAuthRequiredEvents, signOutStore } from '../services/storeAuthService.js';
import { escapeHtml } from '../utils/helpers.js';
import { submitFlyerUpload } from '../utils/flyerUploadSubmit.js';
import { showImagePreview, showUploadStatus } from '../utils/uploadUi.js';

/**
 * 店舗向けチラシアップロード（ログイン必須・store_id 自動紐付け）
 */
export async function StoreUploadPage() {
    const account = await getStoreAccount();

    if (!account) {
        return getAuthRequiredHTML();
    }

    const storeName = escapeHtml(account.store?.name || '店舗');

    return `
    <div class="admin-upload-page">
      <div class="space-y-6">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-4">
            <button type="button" id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
            <h1 class="page-title">チラシアップロード</h1>
          </div>
          <button type="button" id="logout-button" class="btn-secondary text-sm">ログアウト</button>
        </div>

        <div class="info-box green">
          <p>ログイン中: <strong>${storeName}</strong></p>
          ${account.loginId ? `<p class="text-sm mt-1">店舗ログインID: <strong class="font-mono">${account.loginId}</strong></p>` : ''}
        </div>

        <div class="upload-form-card">
          <form id="upload-form">
            <input type="hidden" id="store-id-hidden" value="${account.storeId}" />

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

export async function attachStoreUploadPageEvents() {
    const account = await getStoreAccount();
    if (!account) {
        attachAuthRequiredEvents();
        return;
    }

    document.getElementById('back-button')?.addEventListener('click', () => {
        window.location.hash = '/home';
    });

    document.getElementById('logout-button')?.addEventListener('click', async () => {
        await signOutStore();
        window.location.hash = '/store/login';
    });

    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');
    const previewArea = document.getElementById('preview-area');
    const uploadStatus = document.getElementById('upload-status');
    const uploadButton = document.getElementById('upload-button');
    const storeId = account.storeId;

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) showImagePreview(file, previewArea);
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fileInputEl = document.getElementById('file-input');
            if (!fileInputEl?.files[0]) {
                showUploadStatus(uploadStatus, 'エラー: ファイルを選択してください。', 'error');
                return;
            }

            const file = fileInputEl.files[0];
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

