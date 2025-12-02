/**
 * OCR結果確認モーダルコンポーネント
 * ユーザーがOCR抽出結果を確認してから商品を追加できるようにする
 */

import { escapeHtml } from '../utils/helpers.js';

/**
 * OCR結果確認モーダルを表示する
 * @param {Array} items - 抽出された商品情報の配列
 * @param {Function} onConfirm - 確認ボタンがクリックされた時のコールバック関数
 * @param {Function} onCancel - キャンセルボタンがクリックされた時のコールバック関数
 */
export function showOCRResultModal(items, onConfirm, onCancel) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('ocr-result-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // モーダル要素を作成
    const modal = createModalElement(items, onConfirm, onCancel);
    document.body.appendChild(modal);

    // アニメーションで表示
    setTimeout(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // スクロールを無効化
    }, 10);

    // ESCキーでモーダルを閉じる
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };
    document.addEventListener('keydown', handleEscape);
    modal.dataset.escapeHandler = 'true';
}

/**
 * モーダル要素を作成する
 */
function createModalElement(items, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.id = 'ocr-result-modal';
    modal.className = 'ocr-result-modal';

    const itemsHTML = items.map((item, index) => `
        <tr class="ocr-result-item" data-index="${index}">
            <td class="ocr-result-checkbox">
                <input 
                    type="checkbox" 
                    class="item-checkbox" 
                    data-index="${index}"
                    checked
                />
            </td>
            <td class="ocr-result-name">
                <input 
                    type="text" 
                    class="item-name-input" 
                    value="${escapeHtml(item.name || '')}"
                    data-index="${index}"
                />
            </td>
            <td class="ocr-result-price">
                <input 
                    type="number" 
                    class="item-price-input" 
                    value="${item.price || 0}"
                    data-index="${index}"
                    min="0"
                />
            </td>
        </tr>
    `).join('');

    modal.innerHTML = `
        <div class="ocr-result-modal-overlay"></div>
        <div class="ocr-result-modal-content">
            <button class="ocr-result-modal-close" aria-label="閉じる">&times;</button>
            <div class="ocr-result-modal-header">
                <h2 class="ocr-result-modal-title">OCR抽出結果の確認</h2>
                <p class="ocr-result-modal-subtitle">${items.length}件の商品が抽出されました。確認してから追加してください。</p>
            </div>
            <div class="ocr-result-modal-body">
                <table class="ocr-result-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">選択</th>
                            <th>商品名</th>
                            <th style="width: 150px;">価格（円）</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>
            <div class="ocr-result-modal-footer">
                <button class="btn-secondary" id="ocr-result-cancel">キャンセル</button>
                <button class="btn-primary" id="ocr-result-confirm">商品を追加</button>
            </div>
        </div>
    `;

    // イベントリスナーを設定
    const overlay = modal.querySelector('.ocr-result-modal-overlay');
    const closeButton = modal.querySelector('.ocr-result-modal-close');
    const cancelButton = modal.querySelector('#ocr-result-cancel');
    const confirmButton = modal.querySelector('#ocr-result-confirm');

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
        if (onCancel) {
            onCancel();
        }
    };

    overlay.addEventListener('click', closeModal);
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    confirmButton.addEventListener('click', () => {
        // チェックされた商品のみを取得
        const selectedItems = [];
        items.forEach((item, index) => {
            const checkbox = modal.querySelector(`.item-checkbox[data-index="${index}"]`);
            if (checkbox && checkbox.checked) {
                const nameInput = modal.querySelector(`.item-name-input[data-index="${index}"]`);
                const priceInput = modal.querySelector(`.item-price-input[data-index="${index}"]`);
                
                const name = nameInput ? nameInput.value.trim() : item.name || '';
                const price = priceInput ? parseFloat(priceInput.value) || 0 : item.price || 0;

                if (name && price > 0) {
                    selectedItems.push({
                        name: name,
                        price: price,
                        description: item.description || '',
                        category: item.category || ''
                    });
                }
            }
        });

        closeModal();
        if (onConfirm) {
            onConfirm(selectedItems);
        }
    });

    return modal;
}

/**
 * モーダルを閉じる
 */
export function closeOCRResultModal() {
    const modal = document.getElementById('ocr-result-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

