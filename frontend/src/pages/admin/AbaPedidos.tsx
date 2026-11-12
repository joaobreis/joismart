import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { chamar, linhas } from '../../lib/api';
import { SF } from '../../lib/sf-ids';
import { brl } from '../../lib/loja';
import { getMitraErrorMessage } from '../../lib/utils';

const SITUACOES = [
  { value: '1', label: 'Aguardando pagamento' }, { value: '2', label: 'Pago' }, { value: '3', label: 'Em produção' },
  { value: '4', label: 'Enviado' }, { value: '5', label: 'Saiu para entrega' }, { value: '6', label: 'Entregue' }, { value: '7', label: 'Cancelado' },
];
const variante = (id: number) => (id === 1 ? 'warning' : id === 7 ? 'danger' : id === 6 ? 'success' : id === 2 ? 'accent' : 'info');
const dataBr = (s: string | null) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}` : '–');
const POR_PAGINA = 20;

interface Pedido { ID: number; CRIADO_EM: string; STATUS_ID: number; STATUS: string; EMAIL: string; NOME_RECEBEDOR: string; CIDADE: string; UF: string; TOTAL: number; QTD: number; TOTAL_LINHAS: number; FORMA_PAGAMENTO: string | null; PARCELAS: number | null; }

export default function AbaPedidos() {
  const [status, setStatus] = useState('0');
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [pagina, setPagina] = useState(0);
  const [lista, setLista] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => { const t = setTimeout(() => { setTermo(busca.trim()); setPagina(0); }, 400); return () => clearTimeout(t); }, [busca]);

  function carregar() {
    setLista(null); setErro('');
    linhas(SF.adm_pedidos, { status: Number(status), busca: termo, limit: POR_PAGINA, offset: pagina * POR_PAGINA })
      .then((r) => setLista(r.map((x) => ({ ...x, ID: Number(x.ID), STATUS_ID: Number(x.STATUS_ID), TOTAL: Number(x.TOTAL), QTD: Number(x.QTD), TOTAL_LINHAS: Number(x.TOTAL_LINHAS) }))))
      .catch((e) => { setErro(getMitraErrorMessage(e)); setLista([]); });
  }
  useEffect(carregar, [status, termo, pagina]);

  const total = lista?.[0]?.TOTAL_LINHAS ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
        <Select value={status} onChange={(v) => { setStatus(v); setPagina(0); }} options={[{ value: '0', label: 'Todas as situações' }, ...SITUACOES]} searchThreshold={99} />
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-subtle)' }} />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número, nome ou e-mail" className="pl-9" />
        </div>
      </div>
      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr style={{ color: 'var(--fg-muted)' }} className="text-left">
              <th className="px-4 py-3 font-medium">Pedido</th><th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Situação</th><th className="px-4 py-3 font-medium text-right">Plaquinhas</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {!lista ? <tr><td colSpan={5} className="p-4"><div className="skeleton h-24 rounded-xl" /></td></tr>
              : lista.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--fg-subtle)' }}>Nenhum pedido encontrado.</td></tr>
              : lista.map((p) => (
                <tr key={p.ID} className="border-t cursor-pointer hover:bg-[var(--surface-hover)]" style={{ borderColor: 'var(--border-subtle)' }} onClick={() => setAberto(p.ID)}>
                  <td className="px-4 py-3"><span className="font-semibold">#{p.ID}</span><div className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>{dataBr(p.CRIADO_EM)}</div></td>
                  <td className="px-4 py-3">{p.NOME_RECEBEDOR}<div className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>{p.EMAIL} · {p.CIDADE}/{p.UF}</div></td>
                  <td className="px-4 py-3"><Badge variant={variante(p.STATUS_ID)} dot>{p.STATUS}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.QTD}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{brl(p.TOTAL)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
      {total > POR_PAGINA && (
        <div className="flex justify-end items-center gap-3 text-[13px]">
          <button className="nav-item" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span style={{ color: 'var(--fg-muted)' }}>{pagina + 1} de {paginas}</span>
          <button className="nav-item" disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </div>
      )}
      {aberto != null && <DetalhePedido id={aberto} onClose={() => setAberto(null)} onMudou={carregar} />}
    </div>
  );
}

function DetalhePedido({ id, onClose, onMudou }: { id: number; onClose: () => void; onMudou: () => void }) {
  const [itens, setItens] = useState<any[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const carregar = () => linhas(SF.adm_pedidoDetalhe, { pedidoId: id }).then(setItens).catch((e) => setErro(getMitraErrorMessage(e)));
  useEffect(() => { carregar(); }, [id]);

  async function mudar(v: string) {
    setSalvando(true); setErro('');
    try { await chamar(SF.adm_pedidoSituacao, { pedidoId: id, statusId: Number(v) }); await carregar(); onMudou(); }
    catch (e) { setErro(getMitraErrorMessage(e)); }
    finally { setSalvando(false); }
  }

  const p = itens?.[0];
  return (
    <Modal isOpen onClose={onClose} title={`Pedido #${id}`} size="lg">
      {!p ? (erro ? <p style={{ color: 'var(--danger)' }}>{erro}</p> : <div className="skeleton h-40 rounded-xl" />) : (
        <div className="flex flex-col gap-4 text-[13.5px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Situação" value={String(p.STATUS_ID)} onChange={mudar} options={SITUACOES} disabled={salvando} searchThreshold={99} />
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--fg-muted)' }}>Pagamento</p>
              <p className="mt-2">{p.FORMA_PAGAMENTO ? (p.FORMA_PAGAMENTO === 'PIX' ? 'Pix' : `Cartão em ${p.PARCELAS}x`) : 'Ainda não pago'}{p.PAGAMENTO_MODO === 'TESTE' && p.FORMA_PAGAMENTO ? ' (teste)' : ''}</p>
            </div>
          </div>
          {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
          <div>
            <p className="font-semibold mb-2">Plaquinhas e destinos</p>
            <div className="flex flex-col gap-2">
              {itens!.map((i) => (
                <div key={i.ITEM_ID} className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
                  <p className="font-medium">{i.COR ? `${i.PLACA} (${String(i.COR).toLowerCase()})` : i.PLACA}</p>
                  <p className="break-all" style={{ color: 'var(--fg-muted)' }}>{i.TIPO_DESTINO === 'WIFI' ? `Rede: ${i.DESTINO_1} · Senha: ${i.DESTINO_2 ?? '(aberta)'}` : i.DESTINO_1}{i.TIPO_DESTINO !== 'WIFI' && i.DESTINO_2 ? ` · ${i.DESTINO_2}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-1">Entrega {Number(p.ENTREGA_LOCAL) ? '(grátis em Joinville)' : '(Correios)'}</p>
            <p style={{ color: 'var(--fg-muted)' }}>{p.NOME_RECEBEDOR} · {p.TELEFONE} · {p.EMAIL}</p>
            <p style={{ color: 'var(--fg-muted)' }}>{p.LOGRADOURO}, {p.NUMERO}{p.COMPLEMENTO ? ` – ${p.COMPLEMENTO}` : ''} · {p.BAIRRO} · {p.CIDADE}/{p.UF} · CEP {p.CEP}</p>
          </div>
          <div className="flex justify-between border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>Plaquinhas {brl(Number(p.SUBTOTAL))} · Frete {brl(Number(p.FRETE))}{Number(p.JUROS) > 0 ? ` · Juros ${brl(Number(p.JUROS))}` : ''}</span>
            <span className="font-bold">{brl(Number(p.SUBTOTAL) + Number(p.FRETE) + Number(p.JUROS ?? 0))}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
