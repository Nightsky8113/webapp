-- 店舗ログイン用の数字ID（メールではなく店舗IDでログイン）

ALTER TABLE store_accounts
  ADD COLUMN IF NOT EXISTS login_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS store_accounts_login_id_unique
  ON store_accounts (login_id)
  WHERE login_id IS NOT NULL;

COMMENT ON COLUMN store_accounts.login_id IS '店舗向けログインID（6桁数字・システム発行）';
