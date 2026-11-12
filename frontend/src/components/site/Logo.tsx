interface LogoProps {
  tamanho?: number;
  variante?: 'verde' | 'branco';
  className?: string;
}

// Logo JoiSmart (proposta para aprovação): "joismart" minúsculo, grosso e arredondado,
// com ondas de aproximação (NFC) saindo do pingo do "i".
export default function Logo({ tamanho = 28, variante = 'verde', className = '' }: LogoProps) {
  const cor = variante === 'verde' ? 'var(--accent)' : 'var(--fg)';
  return (
    <span className={`inline-flex items-end gap-0 select-none ${className}`} aria-label="JoiSmart" role="img" style={{ height: tamanho * 1.15 }}>
      <span className="fonte-logo font-black leading-none" style={{ fontSize: tamanho, color: cor, letterSpacing: '-0.045em' }}>
        joismart
      </span>
      <svg width={tamanho * 0.62} height={tamanho * 0.8} viewBox="0 0 26 34" className="-ml-[0.04em] mb-[0.5em]" aria-hidden="true">
        <g fill="none" stroke={cor} strokeWidth="3.6" strokeLinecap="round">
          <path d="M4 12a8 8 0 0 1 0 11" />
          <path d="M11 7a15 15 0 0 1 0 21" />
          <path d="M18 2a22 22 0 0 1 0 31" />
        </g>
      </svg>
    </span>
  );
}

export function LogoSelo({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-[28%]" style={{ width: tamanho, height: tamanho, background: 'var(--accent)' }} aria-hidden="true">
      <svg width={tamanho * 0.56} height={tamanho * 0.56} viewBox="0 0 40 40">
        <g fill="none" stroke="var(--accent-fg)" strokeWidth="4.4" strokeLinecap="round">
          <path d="M10 13a10 10 0 0 1 0 14" />
          <path d="M18 7a19 19 0 0 1 0 26" />
          <path d="M26 1a28 28 0 0 1 0 38" />
        </g>
      </svg>
    </span>
  );
}
