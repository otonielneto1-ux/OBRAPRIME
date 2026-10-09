// Importar / reimportar o cronograma do MS Project (XML). Mostra o resumo antes de gravar.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { lerProjectXML, montarAtividades, planejarImportacao } from '../lib/importarProject.js'
import { fmtData } from '../lib/datas.js'
import { Card, Icon, Tag, useToast } from '../components/index.jsx'

export default function Importar({ goto }) {
  const { obra, recarregarObras } = useApp()
  const toast = useToast()
  const [lendo, setLendo] = useState(false)
  const [erro, setErro] = useState(null)
  const [plano, setPlano] = useState(null)
  const [arquivo, setArquivo] = useState(null)
  const [extras, setExtras] = useState(null)
  const [gravando, setGravando] = useState(false)
  const revisao = (obra?.revisao_atual || 0) + 1

  async function escolher(e) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    setErro(null)
    setPlano(null)
    if (/\.mpp$/i.test(arq.name)) {
      return setErro('Arquivos .mpp não são lidos. No Project: Arquivo › Salvar como › tipo XML.')
    }
    setLendo(true)
    const texto = await arq.text()
    const lido = lerProjectXML(texto)
    if (!lido.ok) { setLendo(false); return setErro(lido.erro) }
    const { data: existentes, erro: falha } = await dados.listarAtividades()
    setLendo(false)
    if (falha) return setErro(falha)
    setArquivo(arq.name)
    setExtras({ titulo: lido.titulo, semLinhaBase: lido.semLinhaBase })
    setPlano(planejarImportacao(existentes, montarAtividades(lido.tarefas), revisao))
  }

  async function confirmar() {
    setGravando(true)
    const { erro: falha } = await dados.importarCronograma(plano, revisao)
    setGravando(false)
    if (falha) return setErro(falha)
    await recarregarObras()
    toast(`Cronograma importado: revisão ${revisao}`)
    goto('crono')
  }

  const r = plano?.resumo
  return (
    <div className="wrap stack">
      <Card titulo={`Importar cronograma · ${obra?.nome || ''}`}>
        <div className="form" style={{ padding: 14 }}>
          <div className="aviso-info">
            <b>1.</b> No MS Project: <b>Arquivo › Salvar como › tipo XML</b>.<br />
            <b>2.</b> Escolha o arquivo aqui. Nada é gravado antes de você conferir o resumo.
            {obra?.revisao_atual > 0 && <><br /><b>Reimportação:</b> o avanço já lançado é mantido. As atividades são reconhecidas pelo código interno do Project (UID).</>}
          </div>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Icon nome="upload" /> {lendo ? 'Lendo o arquivo…' : plano ? 'Escolher outro arquivo' : 'Escolher arquivo XML'}
            <input type="file" accept=".xml,.mpp,text/xml,application/xml" onChange={escolher} style={{ display: 'none' }} disabled={lendo} />
          </label>
          {erro && <div className="aviso-erro">{erro}</div>}
        </div>
      </Card>

      {plano && (
        <Card titulo="Confira antes de gravar" direita={<Tag tom="navy">Revisão {revisao}</Tag>}>
          <div style={{ padding: 14 }} className="stack">
            <div className="info-linha">{arquivo}{extras.titulo ? ` · ${extras.titulo}` : ''}</div>
            <div className="kpis">
              <div className="kpi"><span className="lbl">Atividades</span><div className="n">{r.total}</div><span className="s">{r.folhas} recebem avanço</span></div>
              <div className="kpi"><span className="lbl">Locais</span><div className="n">{r.qtdLocais}</div><span className="s">na linha de balanço</span></div>
              <div className="kpi"><span className="lbl">Serviços</span><div className="n">{r.servicosRepetidos.length}</div><span className="s">repetidos por local</span></div>
            </div>
            <div className="aviso-info">
              Linha de base de <b>{fmtData(r.inicioBase)}</b> a <b>{fmtData(r.terminoBase)}</b>.
              {r.reimportacao && <> <b>{r.novas}</b> atividades novas, <b>{r.atualizadas}</b> atualizadas, <b>{r.removidas}</b> removidas (ficam no histórico, riscadas).</>}
            </div>
            {extras.semLinhaBase > 0 && (
              <div className="aviso-erro" style={{ background: 'var(--warn-bg)', borderColor: 'var(--warn-line)', color: 'var(--warn)' }}>
                {extras.semLinhaBase} atividade{extras.semLinhaBase > 1 ? 's não têm' : ' não tem'} linha de base no arquivo. Nelas, as datas atuais viram a linha de base.
              </div>
            )}
            {r.servicosRepetidos.length > 0 && (
              <div>
                <span className="lbl">Serviços que se repetem por local</span>
                <ul className="list" style={{ marginTop: 6 }}>
                  {r.servicosRepetidos.map((s) => (
                    <li key={s.nome} className="row" style={{ minHeight: 48 }}>
                      <span className="t"><b>{s.nome}</b></span><Tag tom="idle">{s.qtdLocais} locais</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="dr-f">
            <button type="button" className="btn" onClick={() => goto('crono')}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={confirmar} disabled={gravando}>
              <Icon nome="check" /> {gravando ? 'Gravando…' : 'Confirmar importação'}
            </button>
          </div>
        </Card>
      )}

      {!plano && (
        <button type="button" className="btn" onClick={() => goto('crono')}>Voltar ao cronograma</button>
      )}
    </div>
  )
}
