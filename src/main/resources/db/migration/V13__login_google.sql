-- Login com Google: a conta pode existir sem senha, e passa a guardar o identificador fixo
-- da conta Google (o "sub" do ID token). E-mail pode mudar no Google; o sub não.
ALTER TABLE usuario ALTER COLUMN senha_hash DROP NOT NULL;
ALTER TABLE usuario ADD COLUMN google_sub VARCHAR(255);
ALTER TABLE usuario ADD CONSTRAINT uk_usuario_google_sub UNIQUE (google_sub);
