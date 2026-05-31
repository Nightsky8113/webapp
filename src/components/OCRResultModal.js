/**
 * OCR結果確認モーダルコンポーネント
 * ユーザーがOCR抽出結果を確認してから商品を追加できるようにする
 */

import { escapeHtml } from '../utils/helpers.js';
import { getGenres } from '../services/dataService.js';

/**
 * OCR結果確認モーダルを表示する
 * @param {Array} items - 抽出された商品情報の配列
 * @param {Function} onConfirm - 確認ボタンがクリックされた時のコールバック関数
 * @param {Function} onCancel - キャンセルボタンがクリックされた時のコールバック関数
 */
export async function showOCRResultModal(items, onConfirm, onCancel) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('ocr-result-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // ジャンルリストを取得
    const genres = await getGenres();
    
    // モーダル要素を作成
    const modal = createModalElement(items, genres, onConfirm, onCancel);
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
 * 価格を数値に変換する（不正な文字を除去）
 * @param {any} price - 価格の値
 * @returns {number} 数値に変換された価格
 */
function parsePrice(price) {
    if (typeof price === 'number') {
        return Math.round(price);
    }
    
    if (typeof price === 'string') {
        // 数字以外の文字を除去
        const numericString = price.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(numericString);
        return isNaN(parsed) ? 0 : Math.round(parsed);
    }
    
    return 0;
}

/**
 * モーダル要素を作成する
 */
function createModalElement(items, genres, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.id = 'ocr-result-modal';
    modal.className = 'ocr-result-modal';

    const itemsHTML = items.map((item, index) => {
        // 価格を正しくパース
        const parsedPrice = parsePrice(item.price);
        
        // 既存のジャンル名からジャンルIDを取得
        const genreName = item.genre || item.category || '';
        const matchedGenre = genres.find(g => g.name === genreName);
        const selectedGenreId = matchedGenre ? matchedGenre.id : '';
        
        return `
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
                    value="${parsedPrice}"
                    data-index="${index}"
                    min="0"
                    step="1"
                />
            </td>
            <td class="ocr-result-genre">
                <select 
                    class="item-genre-select" 
                    data-index="${index}"
                >
                    <option value="">-- 選択してください --</option>
                    ${genres.map(genre => {
                        const genreName = escapeHtml(genre.name);
                        const isSelected = (matchedGenre && genre.id === matchedGenre.id) ? 'selected' : '';
                        return `<option value="${genre.id}" ${isSelected}>${genreName}</option>`;
                    }).join('')}
                </select>
            </td>
        </tr>
    `;
    }).join('');

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
                            <th style="width: 120px;">価格（円）</th>
                            <th style="width: 150px;">ジャンル</th>
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
                const genreSelect = modal.querySelector(`.item-genre-select[data-index="${index}"]`);
                
                const name = nameInput ? nameInput.value.trim() : item.name || '';
                const price = priceInput ? parsePrice(priceInput.value) : parsePrice(item.price);
                const genreId = genreSelect ? parseInt(genreSelect.value) || null : null;
                
                // ジャンル名を取得
                const selectedGenre = genres.find(g => g.id === genreId);
                const genreName = selectedGenre ? selectedGenre.name : (item.genre || item.category || '');

                if (name && price > 0) {
                    selectedItems.push({
                        name: name,
                        price: price,
                        genre: genreName,
                        genreId: genreId,
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

