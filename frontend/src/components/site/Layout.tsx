import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Package, Shield, LogIn } from 'lucide-react';
import Logo from './Logo';
import IconeWhats from './IconeWhats';
import { useCarrinho, whatsLink } from '../../lib/loja';
import { useLogado, usePerfil } from '../../lib/sessao';

export default function Layout({ children }: { children: ReactNode }) {
  const { qtd } = useCarrinho();
  const logado = useLogado();
  const { perfil } = usePerfil();
  const [aberto, setAberto] = useState(false);
  const local = useLocation();

  useEffect(() => { setAberto(false); }, [local.pathname, local.hash]);
  useEffect(() => {
    if (local.hash) {
      const el = document.getElementById(local.hash.slice(1));
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60); return; }
    }
    window.scrollTo({ top: 0 });
  }, [local.pathname, local.hash]);

  const links = [
    { to: '/#modelos', label: 'Plaquinhas' },
    { to: '/#precos', label: 'Preços' },
    { to: '/#mapa', label: 'Clientes' },
    { to: '/#como-funciona', label: 'Como funciona' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="topo-vidro sticky top-0 z-50">
        <div className="mx-auto max-w-6xl h-16 px-4 md:px-6 flex items-center justify-between gap-4">
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="nav-item">Início</Link>
            {links.map((l) => <Link key={l.to} to={l.to} className="nav-item">{l.label}</Link>)}
          </nav>
          <button className="md:hidden nav-item nav-icone" onClick={() => setAberto(!aberto)} aria-label="Menu">
            {aberto ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-1">
            {perfil?.admin && (
              <NavLink to="/admin" className="nav-item hidden sm:inline-flex" data-active={local.pathname.startsWith('/admin')}>
                <Shield size={16} /> Administração
              </NavLink>
            )}
            {logado ? (
              <NavLink to="/meus-pedidos" className="nav-item hidden sm:inline-flex" data-active={local.pathname === '/meus-pedidos'}>
                <Package size={16} /> Meus pedidos
              </NavLink>
            ) : (
              <Link to={`/login?volta=${encodeURIComponent(local.pathname)}`} className="nav-item hidden sm:inline-flex"><LogIn size={16} /> Entrar</Link>
            )}
            <Link to="/carrinho" className="nav-item relative" aria-label="Carrinho">
              <ShoppingBag size={18} />
              {qtd > 0 && <span className="contador">{qtd}</span>}
            </Link>
          </div>
        </div>
        {aberto && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-1 animate-fadeIn">
            <Link to="/" className="nav-item">Início</Link>
            {links.map((l) => <Link key={l.to} to={l.to} className="nav-item">{l.label}</Link>)}
            {logado
              ? <Link to="/meus-pedidos" className="nav-item"><Package size={16} /> Meus pedidos</Link>
              : <Link to="/login" className="nav-item"><LogIn size={16} /> Entrar ou criar conta</Link>}
            {perfil?.admin && <Link to="/admin" className="nav-item"><Shield size={16} /> Administração</Link>}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Logo tamanho={26} />
            <p className="text-[13px]" style={{ color: 'var(--fg-subtle)' }}>
              Plaquinhas NFC com QR code para o seu negócio crescer. Feito em Joinville, enviado para todo o Brasil.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[14px]">
            <span className="rotulo-secao">Loja</span>
            <Link to="/#modelos" style={{ color: 'var(--fg-muted)' }}>Plaquinhas</Link>
            <Link to="/#precos" style={{ color: 'var(--fg-muted)' }}>Preços e combos</Link>
            <Link to="/carrinho" style={{ color: 'var(--fg-muted)' }}>Carrinho</Link>
            <Link to="/meus-pedidos" style={{ color: 'var(--fg-muted)' }}>Meus pedidos</Link>
          </div>
          <div className="flex flex-col gap-2 text-[14px]">
            <span className="rotulo-secao">Atendimento</span>
            <a href={whatsLink()} target="_blank" rel="noreferrer" style={{ color: 'var(--fg-muted)' }}>WhatsApp (47) 99116-1541</a>
            <span style={{ color: 'var(--fg-muted)' }}>Entrega grátis em Joinville</span>
            <span style={{ color: 'var(--fg-muted)' }}>Pix ou cartão em até 3x sem juros</span>
          </div>
        </div>
        <p className="text-center text-[12px] pb-8" style={{ color: 'var(--fg-subtle)' }}>© {new Date().getFullYear()} JoiSmart · Joinville, SC</p>
      </footer>

      <a href={whatsLink()} target="_blank" rel="noreferrer" className="whats-flutuante" aria-label="Falar no WhatsApp">
        <IconeWhats />
      </a>
    </div>
  );
}
