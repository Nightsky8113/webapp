import { escapeHtml } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * ジャンルカードコンポーネント（分離版）
 * HTMLは外部テンプレート、CSSはカスタムクラスを使用
 * 
 * @param {Object} genre - ジャンルデータ
 * @returns {Promise<string>} HTML文字列
 */
export async function GenreCard(genre) {
    if (!genre) return '';

    const genreName = escapeHtml(genre.name);
    const icon = genre.icon || '📦';

    // テンプレートデータを準備
    const templateData = {
        id: genre.id,
        genreName: genreName,
        icon: icon
    };

    // テンプレートを読み込んでレンダリング
    try {
        return await loadAndRenderTemplate('/src/templates/components/genre-card.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        // フォールバック: インラインHTML（既存の方法）
        return `
        <button
          class="genre-card"
          data-genre-id="${genre.id}"
          aria-label="${genreName}ジャンルで検索"
        >
          <div class="text-6xl mb-4">${icon}</div>
          <div class="font-bold text-gray-800 text-lg mb-2">${genreName}</div>
          <div class="text-blue-600 text-xs font-medium">選択する →</div>
        </button>
      `;
    }
}

/**
 * ジャンルカードのクリックイベントを設定
 * @param {HTMLElement} container - コンテナ要素
 * @param {Function} onCardClick - クリック時のコールバック
 */
export function attachGenreCardEvents(container, onCardClick) {
    if (!container) return;

    // イベントデリゲーション
    container.addEventListener('click', async (e) => {
        const card = e.target.closest('[data-genre-id]');
        if (card) {
            const genreId = parseInt(card.dataset.genreId);
            if (onCardClick && typeof onCardClick === 'function') {
                const result = onCardClick(genreId);
                if (result instanceof Promise) {
                    await result;
                }
            }
        }
    });
}