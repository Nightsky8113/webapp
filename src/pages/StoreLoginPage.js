import { signInStore } from '../services/storeAuthService.js';

/**
 * 店舗ログインページ（6桁の店舗ログインID + パスワード）
 */
export async function StoreLoginPage() {
    return `
    <div class="store-portal-page space-y-6">
      <div class="flex items-center gap-4">
        <button type="button" id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="page-title">店舗ログイン</h1>
      </div>

      <div class="info-box blue max-w-md mx-auto">
        <p>登録時に発行された<strong>6桁の店舗ログインID</strong>とパスワードを入力してください。</p>
      </div>

      <div class="upload-form-card max-w-md mx-auto">
        <form id="login-form" class="space-y-4">
          <div class="form-group">
            <label for="login-id" class="form-label">店舗ログインID（6桁）</label>
            <input
              type="text"
              id="login-id"
              class="form-input w-full font-mono text-lg tracking-widest"
              inputmode="numeric"
              pattern="[0-9]{6}"
              maxlength="6"
              required
              autocomplete="username"
              placeholder="例: 482917"
            />
          </div>
          <div class="form-group">
            <label for="login-password" class="form-label">パスワード</label>
            <input
              type="password"
              id="login-password"
              class="form-input w-full"
              required
              autocomplete="current-password"
            />
          </div>
          <div id="login-status" class="upload-status hidden"></div>
          <button type="submit" id="login-submit" class="btn-primary w-full">ログイン</button>
        </form>
      </div>

      <p class="text-center text-sm text-gray-500">
        初めての方は
        <a href="#/store/register" class="text-blue-600 hover:underline">店舗登録（IDを発行）</a>
      </p>
    </div>
  `;
}

export async function attachStoreLoginPageEvents() {
    document.getElementById('back-button')?.addEventListener('click', () => {
        window.location.hash = '/home';
    });

    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginId = document.getElementById('login-id')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        const statusEl = document.getElementById('login-status');
        const submitBtn = document.getElementById('login-submit');

        if (!loginId || !password) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'ログイン中...';
        }
        showLoginStatus(statusEl, 'ログイン中...', 'loading');

        const result = await signInStore(loginId, password);

        if (result.success) {
            const label = result.account.loginId
                ? `ログインID: ${result.account.loginId}`
                : '';
            showLoginStatus(
                statusEl,
                `ようこそ、${result.account.store?.name || '店舗'}さん ${label}`,
                'success'
            );
            setTimeout(() => {
                window.location.hash = '/store/upload';
            }, 500);
        } else {
            showLoginStatus(statusEl, result.error || 'ログインに失敗しました。', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'ログイン';
            }
        }
    });
}

function showLoginStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = `upload-status ${type}`;
    el.classList.remove('hidden');
}
