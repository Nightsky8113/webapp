/**
 * チラシアップロードUIの共通処理
 */

import { escapeHtml } from './helpers.js';

export function showImagePreview(file, previewArea) {
    if (!previewArea || !file) return;

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

export function showUploadStatus(statusElement, message, type) {
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `upload-status ${type}`;
    statusElement.classList.remove('hidden');

    const styles = {
        error: { color: '#dc2626', backgroundColor: '#fee2e2' },
        success: { color: '#16a34a', backgroundColor: '#dcfce7' },
        loading: { color: '#2563eb', backgroundColor: '#dbeafe' }
    };

    const style = styles[type];
    if (style) {
        statusElement.style.color = style.color;
        statusElement.style.backgroundColor = style.backgroundColor;
    }
}

export function resetUploadPreview(previewArea) {
    if (!previewArea) return;
    previewArea.classList.add('hidden');
    previewArea.innerHTML = '';
}
