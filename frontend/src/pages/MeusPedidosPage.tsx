import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import Layout from '../components/site/Layout';
import Badge from '../components/ui/Badge';
import { brl } from '../lib/loja';
import { linhas } from '../lib/api';
import { SF } from '../lib/sf-ids';
import { getMitraErrorMessage } from '../lib/utils';
import { variantePorSituacao } from './PedidoPage';

interface Pedido { ID: number; CRIADO_EM: string; STATUS_ID: number; STATUS: string; TOTAL: number; QTD: number; ENTREGA_LOCAL: number | boolean; }
const POR_PAGINA = 10;
const dataBr = (s: string) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '');

export default function MeusPedidosPage() {
  const [pagina, setPagina] = useState(0);
  const [lista, setLista] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLista(null);
    linhas(SF.cli_meusPedidos, { limit: POR_PAGINA + 1, offset: pagina * POR_PAGINA })
      .then((r) => setLista(r.map((x) => ({ ...x, STATUS_ID: Number(x.STATUS_ID), TOTAL: Number(x.TOTAL), QTD: Number(x.QTD) }))))
      .catch((e) => { setErro(getMitraErrorMessage(e)); setLista([]); });
  }, [pagina]);

  const visiveis = (lista ?? []).slice(0, POR_PAGINA);
  const temMais = (lista?.length ?? 0) > POR_PAGINA;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-8 md:py-12">
        <h1 className="vitrine-sub">Meus pedidos</h1>
        {erro && <p className="mt-4" style={{ color: 'var(--danger)' }}>{erro}</p>}
        {!lista ? <div className="skeleton h-48 rounded-2xl mt-6" /> : visiveis.length === 0 && pagina === 0 ? (
          <div className="cartao p-10 mt-6 flex flex-col items-center text-center gap-4">
            <span className="passo-num"><Package size={20} /></span>
            <p style={{ color: 'var(--fg-muted)' }}>Você ainda não fez nenhum pedido.</p>
            <Link to="/#modelos" className="botao-vitrine">Ver plaquinhas</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-6">
            {visiveis.map((p) => (
              <Link key={p.ID} to={`/pedido/${p.ID}`} className="cartao placa-hover p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">Pedido #{p.ID}</span>
                    <Badge variant={variantePorSituacao(p.STATUS_ID)} dot>{p.STATUS}</Badge>
                  </div>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
                    {dataBr(p.CRIADO_EM)} · {p.QTD} plaquinha{p.QTD > 1 ? 's' : ''} · {Number(p.ENTREGA_LOCAL) ? 'entrega em Joinville' : 'Correios'}
                  </p>
                </div>
                <span className="font-bold tabular-nums">{brl(p.TOTAL)}</span>
                <ChevronRight size={18} style={{ color: 'var(--fg-subtle)' }} />
              </Link>
            ))}
            {(pagina > 0 || temMais) && (
              <div className="flex justify-between items-center mt-2">
                <button className="botao-vitrine-sec !h-10 !text-[14px] disabled:opacity-40" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anteriores</button>
                <span className="text-[13px]" style={{ color: 'var(--fg-subtle)' }}>Página {pagina + 1}</span>
                <button className="botao-vitrine-sec !h-10 !text-[14px] disabled:opacity-40" disabled={!temMais} onClick={() => setPagina(pagina + 1)}>Próximos</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
