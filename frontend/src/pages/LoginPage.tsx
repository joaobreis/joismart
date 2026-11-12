import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  loginWithGoogleMitra,
  emailLoginMitra,
  emailSignupMitra,
  emailVerifyCodeMitra,
  emailResendCodeMitra,
  sendPasswordResetCodeMitra,
  validatePasswordResetCodeMitra,
  resetPasswordMitra,
} from 'mitra-interactions-sdk';
import type { LoginResponse } from 'mitra-interactions-sdk';
import { initMitra, saveSession } from '../lib/mitra-auth';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Logo from '../components/site/Logo';
import { definirLogado } from '../lib/sessao';

const AUTH_URL = import.meta.env.VITE_MITRA_AUTH_URL;
const PROJECT_ID = Number(import.meta.env.VITE_MITRA_PROJECT_ID);
const loginOpts = { authUrl: AUTH_URL, projectId: PROJECT_ID, create: true };

type View = 'main' | 'verify' | 'forgot-email' | 'forgot-code' | 'forgot-newpassword';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const voltaBruta = params.get('volta') || '/';
  const volta = voltaBruta.startsWith('/') && !voltaBruta.startsWith('//') && !voltaBruta.startsWith('/login') ? voltaBruta : '/';
  const [aviso, setAviso] = useState('');

  // State
  const [view, setView] = useState<View>('main');
  const [isCreate, setIsCreate] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleSuccess(response: LoginResponse) {
    saveSession(response);
    // O login pelo popup deixa a SDK configurada sem onTokenRefresh/onSessionExpired: ela renovaria
    // so em memoria e o localStorage ficaria com o token antigo. Reconfigura a partir da sessao salva.
    initMitra();
    definirLogado(true);
    onLogin();
    navigate(volta, { replace: true });
  }

  // ── SSO (popup) ──

  async function handleSso(provider: 'google') {
    setLoading(provider);
    setError('');
    try {
      const response = await loginWithGoogleMitra(loginOpts);
      handleSuccess(response);
    } catch (err: any) {
      setError(err?.message || 'Falha no login. Tente novamente.');
    } finally {
      setLoading(null);
    }
  }

  // ── Email login (silent iframe) ──

  async function handleEmailSubmit() {
    if (isCreate && !name.trim()) { setError('Preencha o nome'); return; }
    if (!email.trim()) { setError('Preencha o email'); return; }
    if (!password.trim()) { setError('Preencha a senha'); return; }

    setLoading('email');
    setError('');

    try {
      if (isCreate) {
        await emailSignupMitra({ ...loginOpts, name: name.trim(), email: email.trim(), password: password.trim() });
        // Signup ok → precisa verificar código
        setView('verify');
      } else {
        const response = await emailLoginMitra({ ...loginOpts, email: email.trim(), password: password.trim() });
        handleSuccess(response);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro na autenticação');
    } finally {
      setLoading(null);
    }
  }

  // ── Verificação de código ──

  async function handleVerifyCode() {
    if (!code.trim() || code.trim().length < 6) { setError('Digite o código de 6 dígitos'); return; }

    setLoading('verify');
    setError('');

    try {
      const response = await emailVerifyCodeMitra({
        ...loginOpts,
        email: email.trim(),
        code: code.trim(),
        password: password.trim(),
      });
      handleSuccess(response);
    } catch (err: any) {
      setError(err?.message || 'Código inválido ou expirado');
    } finally {
      setLoading(null);
    }
  }

  async function handleResendCode() {
    setLoading('resend');
    setError('');
    try {
      await emailResendCodeMitra({ ...loginOpts, email: email.trim() });
      setError(''); // limpa erro anterior
    } catch {
      // silencioso
    } finally {
      setLoading(null);
    }
  }

  // ── Esqueci minha senha ──

  function goToForgot() {
    setView('forgot-email');
    setError('');
    setSuccess('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
  }

  function backToLogin() {
    setView('main');
    setError('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleSendResetCode() {
    if (!email.trim()) { setError('Preencha o email'); return; }

    setLoading('forgot-send');
    setError('');

    try {
      await sendPasswordResetCodeMitra({ authUrl: AUTH_URL, email: email.trim() });
      setCode('');
      setView('forgot-code');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar o código');
    } finally {
      setLoading(null);
    }
  }

  async function handleValidateResetCode() {
    if (!code.trim() || code.trim().length < 6) { setError('Digite o código de 6 dígitos'); return; }

    setLoading('forgot-validate');
    setError('');

    try {
      await validatePasswordResetCodeMitra({ authUrl: AUTH_URL, email: email.trim(), code: code.trim() });
      setView('forgot-newpassword');
    } catch (err: any) {
      setError(err?.message || 'Código inválido ou expirado');
    } finally {
      setLoading(null);
    }
  }

  async function handleResetPassword() {
    if (!newPassword.trim()) { setError('Preencha a nova senha'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem'); return; }

    setLoading('forgot-reset');
    setError('');

    try {
      await resetPasswordMitra({
        authUrl: AUTH_URL,
        email: email.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      });
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCode('');
      setView('main');
      setSuccess('Senha redefinida! Entre com a nova senha.');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível redefinir a senha');
    } finally {
      setLoading(null);
    }
  }

  // ── Render ──

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 hero-fundo">
      <Link to="/" aria-label="Voltar para a loja"><Logo tamanho={36} /></Link>
      <Card className="w-full max-w-sm animate-scaleIn">
        <CardContent className="pt-8 pb-6 px-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>
              {view === 'verify' || view === 'forgot-code'
                ? 'Verifique seu email'
                : view === 'forgot-email'
                  ? 'Recuperar senha'
                  : view === 'forgot-newpassword'
                    ? 'Nova senha'
                    : isCreate ? 'Criar conta' : 'Entrar na JoiSmart'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
              {view === 'verify' || view === 'forgot-code'
                ? `Enviamos um código para ${email}`
                : view === 'forgot-email'
                  ? 'Digite seu email para receber um código'
                  : view === 'forgot-newpassword'
                    ? 'Escolha uma nova senha para sua conta'
                    : isCreate
                      ? 'Preencha os dados para criar sua conta'
                      : 'Para fechar o pedido e acompanhar a entrega'}
            </p>
          </div>

          {view === 'verify' ? (
            /* ── Tela de verificação de código ── */
            <div className="flex flex-col gap-4">
              <Input
                label="Código de verificação"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                className="text-center text-2xl tracking-[0.5em] font-bold"
                autoFocus
              />

              <Button size="lg" className="w-full" onClick={handleVerifyCode} disabled={loading !== null}>
                {loading === 'verify' ? 'Verificando...' : 'Verificar'}
              </Button>

              <button
                onClick={handleResendCode}
                disabled={loading !== null}
                className="text-sm font-medium cursor-pointer border-0 bg-transparent disabled:opacity-50"
                style={{ color: 'var(--accent)' }}
              >
                {loading === 'resend' ? 'Enviando...' : 'Reenviar código'}
              </button>
            </div>
          ) : view === 'forgot-email' ? (
            /* ── Esqueci minha senha: pedir email ── */
            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendResetCode()}
                disabled={loading !== null}
                autoFocus
              />

              <Button size="lg" className="w-full" onClick={handleSendResetCode} disabled={loading !== null}>
                {loading === 'forgot-send' ? 'Enviando...' : 'Enviar código'}
              </Button>

              <button
                onClick={backToLogin}
                disabled={loading !== null}
                className="text-sm cursor-pointer border-0 bg-transparent disabled:opacity-50"
                style={{ color: 'var(--fg-muted)' }}
              >
                ← Voltar para login
              </button>
            </div>
          ) : view === 'forgot-code' ? (
            /* ── Esqueci minha senha: validar código ── */
            <div className="flex flex-col gap-4">
              <Input
                label="Código de verificação"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateResetCode()}
                className="text-center text-2xl tracking-[0.5em] font-bold"
                autoFocus
              />

              <Button size="lg" className="w-full" onClick={handleValidateResetCode} disabled={loading !== null}>
                {loading === 'forgot-validate' ? 'Validando...' : 'Validar código'}
              </Button>

              <button
                onClick={handleSendResetCode}
                disabled={loading !== null}
                className="text-sm font-medium cursor-pointer border-0 bg-transparent disabled:opacity-50"
                style={{ color: 'var(--accent)' }}
              >
                {loading === 'forgot-send' ? 'Enviando...' : 'Reenviar código'}
              </button>

              <button
                onClick={backToLogin}
                disabled={loading !== null}
                className="text-sm cursor-pointer border-0 bg-transparent disabled:opacity-50"
                style={{ color: 'var(--fg-muted)' }}
              >
                ← Voltar para login
              </button>
            </div>
          ) : view === 'forgot-newpassword' ? (
            /* ── Esqueci minha senha: nova senha ── */
            <div className="flex flex-col gap-4">
              <Input
                label="Nova senha"
                type="password"
                placeholder="Sua nova senha"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading !== null}
                autoFocus
              />

              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                disabled={loading !== null}
              />

              <Button size="lg" className="w-full" onClick={handleResetPassword} disabled={loading !== null}>
                {loading === 'forgot-reset' ? 'Salvando...' : 'Redefinir senha'}
              </Button>

              <button
                onClick={backToLogin}
                disabled={loading !== null}
                className="text-sm cursor-pointer border-0 bg-transparent disabled:opacity-50"
                style={{ color: 'var(--fg-muted)' }}
              >
                ← Voltar para login
              </button>
            </div>
          ) : (
            /* ── Tela principal: SSO + Email ── */
            <div className="flex flex-col gap-3">
              {/* SSO buttons */}
              <Button variant="secondary" size="lg" className="w-full" onClick={() => handleSso('google')} disabled={loading !== null}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading === 'google' ? 'Aguarde...' : 'Continue com Google'}
              </Button>

<div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" className="w-full" onClick={() => setAviso('O login com Facebook está em modo de teste e chega em breve. Por enquanto, entre com Google ou e-mail.')} disabled={loading !== null}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" /></svg>
                  Facebook
                </Button>
                <Button variant="secondary" size="lg" className="w-full" onClick={() => setAviso('O login com Apple está em modo de teste e chega em breve. Por enquanto, entre com Google ou e-mail.')} disabled={loading !== null}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.17-1 1.17-2.2 1.84-3.5 1.74a3.5 3.5 0 0 1-.03-.43c0-1.1.48-2.27 1.33-3.24.42-.49.96-.9 1.61-1.22.65-.32 1.27-.5 1.85-.53.01.17.02.34.02.51zm4.6 16.3c-.35.81-.77 1.56-1.25 2.25-.66.94-1.2 1.6-1.61 1.95-.65.6-1.35.9-2.09.92-.53 0-1.17-.15-1.92-.46-.75-.3-1.44-.46-2.07-.46-.66 0-1.37.16-2.13.46-.76.31-1.37.47-1.84.49-.71.03-1.42-.28-2.13-.95-.45-.4-1.02-1.08-1.7-2.04-.73-1.03-1.33-2.22-1.8-3.58C.03 14.84-.22 13.4-.22 12c0-1.6.35-2.99 1.04-4.15a6.1 6.1 0 0 1 2.18-2.2 5.86 5.86 0 0 1 2.94-.84c.58 0 1.34.18 2.28.53.94.35 1.54.53 1.8.53.2 0 .87-.21 2-.62 1.07-.39 1.98-.55 2.72-.48 2 .16 3.51.95 4.5 2.38-1.8 1.09-2.68 2.61-2.66 4.56.02 1.52.57 2.79 1.65 3.8.49.46 1.04.82 1.65 1.08-.13.38-.27.75-.42 1.1z" /></svg>
                  Apple
                </Button>
              </div>
              {aviso && <p className="text-[12.5px] text-center" style={{ color: 'var(--warning-text)' }}>{aviso}</p>}

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--fg-muted)' }}>
                  {isCreate ? 'Ou crie com e-mail' : 'Ou entre com e-mail'}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              </div>

              {/* Email form */}
              {isCreate && (
                <Input
                  label="Nome"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading !== null}
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading !== null}
              />

              <Input
                label="Senha"
                type="password"
                placeholder="Sua senha"
                autoComplete={isCreate ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                disabled={loading !== null}
              />

              <Button size="lg" className="w-full" onClick={handleEmailSubmit} disabled={loading !== null}>
                {loading === 'email'
                  ? (isCreate ? 'Cadastrando...' : 'Entrando...')
                  : (isCreate ? 'Cadastrar' : 'Entrar')}
              </Button>

              {!isCreate && (
                <button
                  onClick={goToForgot}
                  disabled={loading !== null}
                  className="text-sm cursor-pointer border-0 bg-transparent disabled:opacity-50"
                  style={{ color: 'var(--accent)' }}
                >
                  Esqueci minha senha
                </button>
              )}

              {/* Toggle login/create */}
              <button
                onClick={() => { setIsCreate(!isCreate); setError(''); setSuccess(''); }}
                className="text-sm cursor-pointer border-0 bg-transparent mt-1"
                style={{ color: 'var(--fg-muted)' }}
              >
                {isCreate
                  ? <>Já tem conta? <span className="font-medium underline" style={{ color: 'var(--accent)' }}>Entre aqui</span></>
                  : <>Não tem conta? <span className="font-medium underline" style={{ color: 'var(--accent)' }}>Crie a sua aqui</span></>}
              </button>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <p className="text-sm text-center mt-4 animate-fadeIn" style={{ color: 'var(--danger)' }}>{error}</p>
          )}
          {success && !error && (
            <p className="text-sm text-center mt-4 animate-fadeIn" style={{ color: 'var(--success)' }}>{success}</p>
          )}
        </CardContent>
      </Card>
      <Link to="/" className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>← Voltar para a loja</Link>
    </div>
  );
}
