import { escapeHtml } from '../utils/helpers.js';

/**
 * ジャンルカードコンポーネント
 * @param {Object} genre - ジャンルデータ
 * @returns {string} HTML文字列
 */
export function GenreCard(genre) {
    if (!genre) return '';

    const genreName = escapeHtml(genre.name);
    const icon = genre.icon || '📦';

    return `
    <div 
      class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105 text-center"
      data-genre-id="${genre.id}"
    >
      <div class="text-5xl mb-3">${icon}</div>
      <div class="font-semibold text-gray-800 text-lg">${genreName}</div>
    </div>
  `;
}

/**
 * ジャンルカードのクリックイベントを設定
 * @param {HTMLElement} container - コンテナ要素
 * @param {Function} onCardClick - クリック時のコールバック
 */
export function attachGenreCardEvents(container, onCardClick) {
    if (!container) return;

    // イベントデリゲーション
    container.addEventListener('click', (e) => {
        const card = e.target.closest('[data-genre-id]');
        if (card) {
            const genreId = parseInt(card.dataset.genreId);
            if (onCardClick && typeof onCardClick === 'function') {
                onCardClick(genreId);
            }
        }
    });
}