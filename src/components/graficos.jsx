// Os dois gráficos da v1: curva S e linha de balanço. SVG feito à mão.
// Recebem os dados já calculados por src/lib/cronograma.js.

import { useState } from 'react'
import { difDias, fmtCurta, addDias } from '../lib/datas.js'

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const MONO = 'IBM Plex Mono, monospace'

/** Cores dos serviços na linha de balanço (vermelho fica reservado para atraso). */
export const CORES_SERVICO = ['#01152E', '#E49B2C', '#1D8A5B', '#6B7A90', '#3A6EA5', '#7A4A00', '#8B5CF6', '#0E7490']

function meses(ini, fim) {
  const out = []
  let [y, m] = ini.split('-').map(Number)
  for (;;) {
    const d = `${y}-${String(m).padStart(2, '0')}-01`
    if (d > fim) break
    if (d >= ini) out.push({ data: d, rotulo: MESES[m - 1] + (m === 1 ? ` ${String(y).slice(2)}` : '') })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}

export function CurvaS({ pontos, hoje }) {
  const [sel, setSel] = useState(null)
  if (!pontos?.length) return null
  const W = 640, H = 250, ml = 42, mr = 14, mt = 22, mb = 34
  const w = W - ml - mr, h = H - mt - mb
  const ini = pontos[0].inicio
  const fim = pontos[pontos.length - 1].fim
  const total = Math.max(1, difDias(ini, fim))
  const x = (data) => ml + (difDias(ini, data) / total) * w
  const y = (v) => mt + h - (v / 100) * h
  const linha = (lista) => lista.map((p, i) => `${i ? 'L' : 'M'}${x(p.fim).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
  const prev = pontos.map((p) => ({ fim: p.fim, v: p.previsto }))
  const real = pontos.filter((p) => p.realizado != null).map((p) => ({ fim: p.fim > hoje ? hoje : p.fim, v: p.realizado }))
  const ultimo = real[real.length - 1]
  const prevHoje = pontos.find((p) => p.inicio <= hoje && p.fim >= hoje)
  const passo = Math.max(1, Math.ceil(meses(ini, fim).length / 8))
  const xh = x(hoje)
  // Semana mostrada embaixo do gráfico: a tocada, ou a atual.
  const idxAtual = pontos.findIndex((q) => q.inicio <= hoje && q.fim >= hoje)
  const p = pontos[sel ?? (idxAtual >= 0 ? idxAtual : pontos.length - 1)]
  return (
    <>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Curva S: realizado ${ultimo?.v ?? 0}%`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} stroke="#E3E8EE" />
          <text x={ml - 8} y={y(v) + 4} textAnchor="end" fontFamily={MONO} fontSize="11" fontWeight="600" fill="#5B6576">{v}%</text>
        </g>
      ))}
      {meses(ini, fim).filter((_, i) => i % passo === 0).map((mm) => (
        <text key={mm.data} x={x(mm.data)} y={H - 12} fontFamily={MONO} fontSize="11" fontWeight="600" fill="#5B6576">{mm.rotulo}</text>
      ))}
      {hoje >= ini && hoje <= fim && (
        <g>
          <line x1={xh} x2={xh} y1={mt} y2={mt + h} stroke="#01152E" strokeDasharray="4 4" strokeWidth="1.5" />
          <rect x={xh - 22} y={2} width="44" height="18" rx="3" fill="#01152E" />
          <text x={xh} y={15} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="600" fill="#fff">HOJE</text>
        </g>
      )}
      <path d={linha(prev)} fill="none" stroke="#01152E" strokeWidth="2.5" />
      {real.length > 0 && <path d={linha(real)} fill="none" stroke="#E49B2C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      {ultimo && <circle cx={x(ultimo.fim)} cy={y(ultimo.v)} r="5.5" fill="#E49B2C" stroke="#fff" strokeWidth="2" />}
      {prevHoje && hoje >= ini && <circle cx={xh} cy={y(prevHoje.previsto)} r="4.5" fill="#01152E" stroke="#fff" strokeWidth="2" />}
      {/* Faixas invisíveis, uma por semana: tocar (celular) ou passar o mouse mostra a semana. */}
      {pontos.map((p, i) => {
        const x0 = i === 0 ? ml : (x(pontos[i - 1].fim) + x(p.fim)) / 2
        const x1 = i === pontos.length - 1 ? W - mr : (x(p.fim) + x(pontos[i + 1].fim)) / 2
        return (
          <rect key={p.inicio} x={x0} y={mt} width={Math.max(1, x1 - x0)} height={h} fill="transparent"
            style={{ cursor: 'pointer' }} onClick={() => setSel(sel === i ? null : i)} onMouseEnter={() => setSel(i)}>
            <title>{`Semana ${fmtCurta(p.inicio)}–${fmtCurta(p.fim)}`}</title>
          </rect>
        )
      })}
      {p && (
        <g pointerEvents="none">
          <line x1={x(p.fim)} x2={x(p.fim)} y1={mt} y2={mt + h} stroke="#5B6576" strokeWidth="1" />
          <circle cx={x(p.fim)} cy={y(p.previsto)} r="5" fill="#01152E" stroke="#fff" strokeWidth="2" />
          {p.realizado != null && <circle cx={x(p.fim)} cy={y(p.realizado)} r="6" fill="#E49B2C" stroke="#fff" strokeWidth="2" />}
        </g>
      )}
    </svg>
    {/* Os números da semana escolhida ficam fora do SVG, em tamanho de texto normal: no celular o gráfico encolhe. */}
    {p && (
      <div className="curva-info" aria-live="polite">
        <span className="lbl">Semana {fmtCurta(p.inicio)}–{fmtCurta(p.fim)}{p.inicio <= hoje && p.fim >= hoje ? ' · atual' : ''}</span>
        <span><b>Previsto {Math.round(p.previsto)}%</b></span>
        <span className="real"><b>{p.realizado != null ? `Realizado ${Math.round(p.realizado)}%` : 'Realizado: ainda não'}</b></span>
      </div>
    )}
    </>
  )
}

function encurtar(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

export function LinhaBalanco({ dados, hoje, cores, onPonto }) {
  const { locais, servicos, colisoes } = dados
  if (!locais.length) return null
  const band = 52
  const W = 900, ml = 190, mr = 16, mt = 30, mb = 40
  const h = band * locais.length
  const H = h + mt + mb
  const w = W - ml - mr
  const ini = addDias(dados.inicio, -7)
  const fim = addDias(dados.fim > hoje ? dados.fim : hoje, 7)
  const total = Math.max(1, difDias(ini, fim))
  const x = (d) => ml + (difDias(ini, d) / total) * w
  const idx = new Map(locais.map((l, i) => [l.chave, i]))
  const yB = (i) => mt + h - i * band
  const yT = (i) => mt + h - (i + 1) * band
  const xh = x(hoje)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Linha de balanço por local e serviço" style={{ minWidth: 720 }}>
      {locais.map((l, i) => (
        <g key={l.chave}>
          <rect x={ml} y={yT(i)} width={w} height={band} fill={i % 2 ? '#F6F8FA' : '#FFFFFF'} />
          <text x={ml - 10} y={yT(i) + band / 2 + 5} textAnchor="end" fontSize="13.5" fontWeight="600" fill="#0E1A2B">
            {encurtar(l.nome, 26)}<title>{l.nome}</title>
          </text>
        </g>
      ))}
      {meses(ini, fim).map((mm) => (
        <g key={mm.data}>
          <line x1={x(mm.data)} x2={x(mm.data)} y1={mt} y2={mt + h} stroke="#E3E8EE" />
          <text x={x(mm.data) + 4} y={H - 14} fontFamily={MONO} fontSize="11.5" fontWeight="600" fill="#5B6576">{mm.rotulo}</text>
        </g>
      ))}
      {servicos.map((s) => {
        const cor = cores[s.nome]
        const prev = s.pontos.map((p) => `${x(p.ib).toFixed(1)},${yB(idx.get(p.local)).toFixed(1)} ${x(p.tb).toFixed(1)},${yT(idx.get(p.local)).toFixed(1)}`).join(' ')
        return (
          <g key={s.nome}>
            <polyline points={prev} fill="none" stroke={cor} strokeWidth="2.2" strokeDasharray="6 5" />
            {s.pontos.filter((p) => p.ir).map((p) => {
              const i = idx.get(p.local)
              const fimReal = p.tr || hoje
              const frac = p.tr ? 1 : p.pct / 100
              return (
                <line key={p.local} x1={x(p.ir)} y1={yB(i)} x2={x(fimReal)} y2={yB(i) - frac * band}
                  stroke={p.atrasada ? '#C62828' : cor} strokeWidth="5" strokeLinecap="round" />
              )
            })}
            {s.pontos.map((p) => {
              const i = idx.get(p.local)
              return (
                <circle key={`c${p.local}`} cx={(x(p.ib) + x(p.tb)) / 2} cy={yT(i) + band / 2} r="14" fill="transparent"
                  style={{ cursor: onPonto ? 'pointer' : 'default' }} onClick={() => onPonto?.(p.atividade_id)}>
                  <title>{`${s.nome} — ${p.pct}% (base ${fmtCurta(p.ib)} a ${fmtCurta(p.tb)})`}</title>
                </circle>
              )
            })}
          </g>
        )
      })}
      {colisoes.map((c) => {
        const i = idx.get(c.local)
        const s1 = servicos.find((s) => s.nome === c.servico1)?.pontos.find((p) => p.local === c.local)
        const s2 = servicos.find((s) => s.nome === c.servico2)?.pontos.find((p) => p.local === c.local)
        if (i == null || !s1 || !s2) return null
        const cx = x(s1.ib > s2.ib ? s1.ib : s2.ib)
        const cy = yT(i) + band / 2
        return (
          <g key={`${c.local}${c.servico1}${c.servico2}`}>
            <circle cx={cx} cy={cy} r="12" fill="#F5B03B" stroke="#01152E" strokeWidth="2" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#01152E">!</text>
            <title>{`Possível colisão: ${c.servico1} e ${c.servico2} em ${c.nomeLocal}`}</title>
          </g>
        )
      })}
      {hoje >= ini && hoje <= fim && (
        <g>
          <line x1={xh} x2={xh} y1={mt - 6} y2={mt + h} stroke="#01152E" strokeWidth="1.5" strokeDasharray="4 4" />
          <rect x={xh - 24} y={mt - 26} width="48" height="18" rx="3" fill="#01152E" />
          <text x={xh} y={mt - 13} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="600" fill="#fff">HOJE</text>
        </g>
      )}
    </svg>
  )
}
