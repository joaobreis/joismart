import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import DatePicker from '../../components/ui/DatePicker';
import { ChartContainer, ShadcnBarChart, FORMATTERS } from '../../components/ui/Chart';
import { linhas } from '../../lib/api';
import { SF } from '../../lib/sf-ids';
import { brl } from '../../lib/loja';
import { getMitraErrorMessage } from '../../lib/utils';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const hoje = () => iso(new Date(Date.now() - 3 * 3600 * 1000));
const inicioMes = () => `${hoje().slice(0, 8)}01`;

interface Resumo { PEDIDOS: number; FATURAMENTO: number; PLACAS: number; FRETE: number; AGUARDANDO: number; A_PRODUZIR: number; }

export default function AbaVendas() {
  const [inicio, setInicio] = useState(inicioMes());
  const [fim, setFim] = useState(hoje());
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [modelos, setModelos] = useState<{ name: string; value: number }[]>([]);
  const [dias, setDias] = useState<{ name: string; value: number }[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!inicio || !fim) return;
    setResumo(null); setErro('');
    const f = { inicio, fim };
    Promise.all([linhas(SF.adm_vendasResumo, f), linhas(SF.adm_vendasPorModelo, f), linhas(SF.adm_vendasPorDia, f)])
      .then(([r, m, d]) => {
        const x = r[0] ?? {};
        setResumo({ PEDIDOS: Number(x.PEDIDOS ?? 0), FATURAMENTO: Number(x.FATURAMENTO ?? 0), PLACAS: Number(x.PLACAS ?? 0), FRETE: Number(x.FRETE ?? 0), AGUARDANDO: Number(x.AGUARDANDO ?? 0), A_PRODUZIR: Number(x.A_PRODUZIR ?? 0) });
        setModelos(m.map((y) => ({ name: String(y.name), value: Number(y.value) })));
        setDias(d.map((y) => ({ name: `${String(y.DIA).slice(8, 10)}/${String(y.DIA).slice(5, 7)}`, value: Number(y.VALOR) })));
      })
      .catch((e) => setErro(getMitraErrorMessage(e)));
  }, [inicio, fim]);

  const ticket = resumo && resumo.PEDIDOS > 0 ? resumo.FATURAMENTO / resumo.PEDIDOS : 0;
  const kpis = resumo ? [
    { r: 'Faturamento', v: brl(resumo.FATURAMENTO), n: `${brl(resumo.FRETE)} de frete` },
    { r: 'Pedidos pagos', v: FORMATTERS.number(resumo.PEDIDOS), n: `ticket médio ${brl(ticket)}` },
    { r: 'Plaquinhas vendidas', v: FORMATTERS.number(resumo.PLACAS), n: 'no período' },
    { r: 'Para produzir', v: FORMATTERS.number(resumo.A_PRODUZIR), n: `${resumo.AGUARDANDO} aguardando pagamento` },
  ] : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <DatePicker label="De" value={inicio} onChange={setInicio} />
        <DatePicker label="Até" value={fim} onChange={setFim} />
      </div>
      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {resumo ? kpis.map((k) => (
          <Card key={k.r} className="p-4">
            <p className="text-[12.5px]" style={{ color: 'var(--fg-muted)' }}>{k.r}</p>
            <p className="text-[22px] font-extrabold tabular-nums mt-1">{k.v}</p>
            <p className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>{k.n}</p>
          </Card>
        )) : [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartContainer title="Plaquinhas por modelo" subtitle="Pedidos pagos no período">
          {modelos.length ? <ShadcnBarChart data={modelos} bars={[{ dataKey: 'value', name: 'Plaquinhas' }]} layout="vertical" formatter={FORMATTERS.number} showLabel />
            : <p className="text-[13px] py-10 text-center" style={{ color: 'var(--fg-subtle)' }}>Sem vendas no período.</p>}
        </ChartContainer>
        <ChartContainer title="Faturamento por dia" subtitle="Pedidos pagos no período">
          {dias.length ? <ShadcnBarChart data={dias} bars={[{ dataKey: 'value', name: 'Faturamento' }]} formatter={FORMATTERS.brl} />
            : <p className="text-[13px] py-10 text-center" style={{ color: 'var(--fg-subtle)' }}>Sem vendas no período.</p>}
        </ChartContainer>
      </div>
    </div>
  );
}
