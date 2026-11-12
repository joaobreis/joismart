import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Checkbox from '../../components/ui/Checkbox';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import MapaClientes from '../../components/site/MapaClientes';
import { chamar, linhas } from '../../lib/api';
import { SF } from '../../lib/sf-ids';
import { getMitraErrorMessage } from '../../lib/utils';

interface Cliente { ID: number; NOME: string; SEGMENTO: string; BAIRRO: string; LAT: number; LNG: number; TESTE: boolean; ATIVO: boolean; }
interface Form { id?: number; nome: string; segmento: string; bairro: string; lat: string; lng: string; teste: boolean; ativo: boolean; }
const VAZIO: Form = { nome: '', segmento: '', bairro: '', lat: '', lng: '', teste: false, ativo: true };
const bool = (v: unknown) => v === true || Number(v) === 1 || v === '1' || v === 'true';

export default function AbaMapa() {
  const [lista, setLista] = useState<Cliente[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [remover, setRemover] = useState<Cliente | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => linhas(SF.adm_mapaListar)
    .then((r) => setLista(r.map((x) => ({ ...x, ID: Number(x.ID), LAT: Number(x.LAT), LNG: Number(x.LNG), TESTE: bool(x.TESTE), ATIVO: bool(x.ATIVO) }))))
    .catch((e) => { setErro(getMitraErrorMessage(e)); setLista([]); });
  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!form) return;
    const lat = Number(form.lat.replace(',', '.')), lng = Number(form.lng.replace(',', '.'));
    if (!form.nome.trim()) { setErro('Informe o nome do cliente.'); return; }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !form.lat || !form.lng) { setErro('Clique no mapa para marcar o local.'); return; }
    setOcupado(true); setErro('');
    const input = { nome: form.nome.trim(), segmento: form.segmento.trim(), bairro: form.bairro.trim(), lat, lng, teste: form.teste ? 1 : 0, ativo: form.ativo ? 1 : 0 };
    try {
      if (form.id) await chamar(SF.adm_mapaAtualizar, { ...input, id: form.id }); else await chamar(SF.adm_mapaCriar, input);
      setForm(null); await carregar();
    } catch (e) { setErro(getMitraErrorMessage(e)); }
    finally { setOcupado(false); }
  }

  async function apagar() {
    if (!remover) return;
    setOcupado(true);
    try { await chamar(SF.adm_mapaRemover, { id: remover.ID }); setRemover(null); await carregar(); }
    catch (e) { setErro(getMitraErrorMessage(e)); }
    finally { setOcupado(false); }
  }

  const testes = (lista ?? []).filter((c) => c.TESTE).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px]" style={{ color: 'var(--fg-muted)' }}>
          {lista ? `${lista.length} clientes no mapa${testes ? `, ${testes} de teste` : ''}.` : ''} Os ativos aparecem na página inicial.
        </p>
        <Button onClick={() => { setErro(''); setForm({ ...VAZIO }); }}><Plus size={16} /> Novo cliente</Button>
      </div>
      {erro && !form && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead><tr className="text-left" style={{ color: 'var(--fg-muted)' }}>
            <th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Bairro</th><th className="px-4 py-3 font-medium">Situação</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {!lista ? <tr><td colSpan={4} className="p-4"><div className="skeleton h-24 rounded-xl" /></td></tr>
              : lista.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center" style={{ color: 'var(--fg-subtle)' }}>Nenhum cliente no mapa ainda.</td></tr>
              : lista.map((c) => (
                <tr key={c.ID} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-3"><span className="font-medium">{c.NOME}</span><div className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>{c.SEGMENTO}</div></td>
                  <td className="px-4 py-3">{c.BAIRRO}</td>
                  <td className="px-4 py-3"><div className="flex gap-1.5">{c.ATIVO ? <Badge variant="success">no mapa</Badge> : <Badge variant="neutral">oculto</Badge>}{c.TESTE && <Badge variant="warning">teste</Badge>}</div></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="nav-item nav-icone" aria-label="Editar" onClick={() => { setErro(''); setForm({ id: c.ID, nome: c.NOME, segmento: c.SEGMENTO ?? '', bairro: c.BAIRRO ?? '', lat: String(c.LAT), lng: String(c.LNG), teste: c.TESTE, ativo: c.ATIVO }); }}><Pencil size={15} /></button>
                    <button className="nav-item nav-icone" aria-label="Remover" onClick={() => setRemover(c)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar cliente do mapa' : 'Novo cliente do mapa'} size="lg">
        {form && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={120} />
              <Input label="Segmento" value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} placeholder="Cafeteria, salão…" maxLength={60} />
              <Input label="Bairro" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} maxLength={60} />
            </div>
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Clique no mapa para marcar o local{form.lat ? ` (marcado: ${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)})` : ''}.</p>
            <MapaClientes altura={300}
              pontos={form.lat ? [{ ID: 0, NOME: form.nome || 'Novo cliente', SEGMENTO: form.segmento, BAIRRO: form.bairro, LAT: Number(form.lat), LNG: Number(form.lng), TESTE: form.teste }] : []}
              aoClicarMapa={(lat, lng) => setForm((f) => (f ? { ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) } : f))} />
            <div className="flex flex-wrap gap-5">
              <Checkbox label="Aparece no mapa" checked={form.ativo} onChange={(v) => setForm({ ...form, ativo: v })} />
              <Checkbox label="Cliente de teste" checked={form.teste} onChange={(v) => setForm({ ...form, teste: v })} />
            </div>
            {erro && <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{erro}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
              <Button onClick={salvar} disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar'}</Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!remover} onClose={() => setRemover(null)} onConfirm={apagar} loading={ocupado}
        title="Remover cliente do mapa" message={`"${remover?.NOME ?? ''}" sai do mapa da página inicial.`} confirmLabel="Remover" />
    </div>
  );
}
