import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, ClipboardList, MapPin, Tags } from 'lucide-react';
import Layout from '../../components/site/Layout';
import { useLogado, usePerfil } from '../../lib/sessao';
import AbaVendas from './AbaVendas';
import AbaPedidos from './AbaPedidos';
import AbaPrecos from './AbaPrecos';
import AbaMapa from './AbaMapa';

const ABAS = [
  { id: 'vendas', label: 'Vendas', icone: BarChart3 },
  { id: 'pedidos', label: 'Pedidos', icone: ClipboardList },
  { id: 'precos', label: 'Preços e frete', icone: Tags },
  { id: 'mapa', label: 'Clientes do mapa', icone: MapPin },
] as const;

export default function AdminPage() {
  const logado = useLogado();
  const { perfil, carregando } = usePerfil();
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('vendas');

  if (!logado) return <Navigate to="/login?volta=%2Fadmin" replace />;
  if (!carregando && perfil && !perfil.admin) return <Navigate to="/" replace />;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
        <h1 className="vitrine-sub">Administração</h1>
        {carregando || !perfil ? <div className="skeleton h-64 rounded-2xl mt-6" /> : (
          <>
            <div className="flex gap-1 mt-5 overflow-x-auto pb-1">
              {ABAS.map((a) => (
                <button key={a.id} className="nav-item shrink-0" data-active={aba === a.id} onClick={() => setAba(a.id)}>
                  <a.icone size={16} /> {a.label}
                </button>
              ))}
            </div>
            <div className="mt-5">
              {aba === 'vendas' && <AbaVendas />}
              {aba === 'pedidos' && <AbaPedidos />}
              {aba === 'precos' && <AbaPrecos />}
              {aba === 'mapa' && <AbaMapa />}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
