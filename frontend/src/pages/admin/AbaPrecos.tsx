import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { chamar, linhas } from '../../lib/api';
import { SF } from '../../lib/sf-ids';
import { brl, calcularPreco, carregarCatalogo } from '../../lib/loja';
import { getMitraErrorMessage } from '../../lib/utils';

const CAMPOS = [
  { k: 'precoUnit', chave: 'PRECO_UNIT', rotulo: 'Preço de 1 plaquinha (R$)', grupo: 'Preços' },
  { k: 'precoCombo', chave: 'PRECO_COMBO3', rotulo: 'Combo de 3 plaquinhas (R$)', grupo: 'Preços' },
  { k: 'freteBase', chave: 'FRETE_BASE', rotulo: 'Frete Correios: 1ª plaquinha (R$)', grupo: 'Frete provisório' },
  { k: 'fretePorPlaca', chave: 'FRETE_POR_PLACA', rotulo: 'Frete: cada plaquinha a mais (R$)', grupo: 'Frete provisório' },
  { k: 'juros4', chave: 'JUROS_4X', rotulo: 'Juros em 4x (%)', grupo: 'Juros do cartão' },
  { k: 'juros5', chave: 'JUROS_5X', rotulo: 'Juros em 5x (%)', grupo: 'Juros do cartão' },
  { k: 'juros6', chave: 'JUROS_6X', rotulo: 'Juros em 6x (%)', grupo: 'Juros do cartão' },
] as const;
const num = (s: string) => Number(String(s).replace(/\./g, '').replace(',', '.'));
const txt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

export default function AbaPrecos() {
  const [valores, setValores] = useState<Record<string, string> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  useEffect(() => {
    linhas(SF.adm_config).then((r) => {
      const m: Record<string, string> = {};
      CAMPOS.forEach((c) => { const l = r.find((x) => x.CHAVE === c.chave); m[c.k] = txt(Number(l?.VALOR ?? 0)); });
      setValores(m);
    }).catch((e) => setMsg({ ok: false, t: getMitraErrorMessage(e) }));
  }, []);

  async function salvar() {
    if (!valores) return;
    const input: Record<string, number> = {};
    for (const c of CAMPOS) {
      const v = num(valores[c.k]);
      if (!Number.isFinite(v) || v < 0 || ((c.k === 'precoUnit' || c.k === 'precoCombo') && v <= 0)) { setMsg({ ok: false, t: `Confira o campo "${c.rotulo}".` }); return; }
      input[c.k] = v;
    }
    setSalvando(true); setMsg(null);
    try { await chamar(SF.adm_configSalvar, input); await carregarCatalogo(true); setMsg({ ok: true, t: 'Salvo. Vale para os pedidos novos.' }); }
    catch (e) { setMsg({ ok: false, t: getMitraErrorMessage(e) }); }
    finally { setSalvando(false); }
  }

  if (!valores) return msg ? <p style={{ color: 'var(--danger)' }}>{msg.t}</p> : <div className="skeleton h-64 rounded-2xl" />;
  const unit = num(valores.precoUnit), combo = num(valores.precoCombo);
  const exemplo = [1, 3, 4, 6].map((q) => ({ q, t: calcularPreco(q, unit || 0, combo || 0).total }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px] items-start">
      <Card className="p-5 flex flex-col gap-5">
        {['Preços', 'Frete provisório', 'Juros do cartão'].map((g) => (
          <div key={g}>
            <p className="font-semibold mb-1">{g}</p>
            {g === 'Frete provisório' && <p className="text-[12.5px] mb-2" style={{ color: 'var(--fg-subtle)' }}>Valores provisórios até termos o peso e as medidas da embalagem. Em Joinville a entrega é sempre grátis.</p>}
            {g === 'Juros do cartão' && <p className="text-[12.5px] mb-2" style={{ color: 'var(--fg-subtle)' }}>Até 3x é sem juros. De 4x a 6x o cliente paga estes juros sobre o total.</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              {CAMPOS.filter((c) => c.grupo === g).map((c) => (
                <Input key={c.k} label={c.rotulo} inputMode="decimal" value={valores[c.k]} onChange={(e) => setValores({ ...valores, [c.k]: e.target.value })} />
              ))}
            </div>
          </div>
        ))}
        {msg && <p className="text-[13px]" style={{ color: msg.ok ? 'var(--success-text)' : 'var(--danger)' }}>{msg.t}</p>}
        <div><Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</Button></div>
      </Card>
      <Card className="p-5">
        <p className="font-semibold mb-2">Como fica no site</p>
        {exemplo.map((e) => (
          <div key={e.q} className="flex justify-between text-[13.5px] py-1"><span style={{ color: 'var(--fg-muted)' }}>{e.q} plaquinha{e.q > 1 ? 's' : ''}</span><span className="tabular-nums font-semibold">{brl(e.t)}</span></div>
        ))}
      </Card>
    </div>
  );
}
