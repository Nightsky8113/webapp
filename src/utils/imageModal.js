/**
 * Vanilla JavaScriptで実装した画像拡大表示機能
 * Lightbox2とjQueryに依存しない、eval()を使用しない実装
 * モーダルオーバーレイで画像を拡大表示する
 */

/**
 * 画像拡大モーダルを作成・初期化する
 * data-lightbox属性を持つ画像リンクに対して、クリック時にモーダルを表示する
 */
export function initImageModal() {
    // 既に初期化済みの場合は何もしない
    if (document.body.dataset.imageModalInitialized === 'true') {
        return;
    }

    // モーダル要素を作成
    const modal = createModalElement();
    document.body.appendChild(modal);

    // 画像リンクにクリックイベントを設定（イベントデリゲーション）
    document.body.addEventListener('click', handleImageClick);
    
    // モーダルを閉じるイベント
    modal.addEventListener('click', handleModalClose);
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', handleEscapeKey);

    document.body.dataset.imageModalInitialized = 'true';
    console.log('✅ Image Modal initialized');
}

/**
 * モーダル要素をDOMに作成する
 * @returns {HTMLElement} モーダル要素
 */
function createModalElement() {
    const modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-overlay"></div>
        <div class="image-modal-content">
            <button class="image-modal-close" aria-label="閉じる">&times;</button>
            <img class="image-modal-image" src="" alt="" />
            <div class="image-modal-title"></div>
        </div>
    `;
    return modal;
}

/**
 * 画像リンクのクリックイベントを処理する
 * data-lightbox属性を持つリンクをクリックしたときにモーダルを表示
 */
function handleImageClick(event) {
    const link = event.target.closest('a[data-lightbox]');
    if (!link) return;

    event.preventDefault();

    const imageUrl = link.href;
    const imageTitle = link.dataset.title || link.getAttribute('title') || '';
    const lightboxGroup = link.dataset.lightbox || '';

    showModal(imageUrl, imageTitle, lightboxGroup);
}

/**
 * モーダルを表示する
 * @param {string} imageUrl - 表示する画像のURL
 * @param {string} imageTitle - 画像のタイトル
 * @param {string} lightboxGroup - ライトボックスグループ（将来の拡張用）
 */
function showModal(imageUrl, imageTitle, lightboxGroup) {
    const modal = document.getElementById('image-modal');
    if (!modal) return;

    const modalImage = modal.querySelector('.image-modal-image');
    const modalTitle = modal.querySelector('.image-modal-title');

    if (!modalImage) return;

    // 画像を読み込んでから表示
    modalImage.src = '';
    modalImage.alt = imageTitle;

    const img = new Image();
    img.onload = () => {
        modalImage.src = imageUrl;
        modalImage.alt = imageTitle;
        if (modalTitle) {
            modalTitle.textContent = imageTitle;
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // スクロールを無効化
    };
    img.onerror = () => {
        console.error('画像の読み込みに失敗しました:', imageUrl);
        modalImage.alt = '画像の読み込みに失敗しました';
    };
    img.src = imageUrl;
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    const modal = document.getElementById('image-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = ''; // スクロールを再有効化
}

/**
 * モーダルを閉じるイベントを処理する
 * オーバーレイまたは閉じるボタンをクリックしたときに閉じる
 */
function handleModalClose(event) {
    const modal = document.getElementById('image-modal');
    if (!modal) return;

    const overlay = modal.querySelector('.image-modal-overlay');
    const closeButton = modal.querySelector('.image-modal-close');

    if (event.target === overlay || event.target === closeButton) {
        closeModal();
    }
}

/**
 * ESCキーでモーダルを閉じる
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('image-modal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    }
}

