-- Single-use token handed out by verify-code and required by change-password, so changing a
-- password needs proof of the verified code instead of just a recently-verified email.
ALTER TABLE public.users ADD COLUMN reset_token_hash character varying(64);
