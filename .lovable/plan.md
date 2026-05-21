
# Mini-site gerador do Manual de Avaliação de iPhone

Site de página única no Lovable onde a loja:
1. Faz upload do logo (PNG/JPG/SVG)
2. Digita nome da loja (e opcionalmente Instagram/telefone — desativável)
3. Pré-visualiza o manual
4. Baixa o PDF personalizado

Sem backend, sem login. PDF gerado no navegador com `pdf-lib`.

## Conteúdo do PDF (revisado conforme pedido)

Estrutura enxuta — somente avaliação, sem nada de envio:

1. **Capa** — logo da loja + nome + título "Manual de Avaliação de iPhone" + campos cliente/IMEI/data/modelo
2. **Como usar** — 2 passos: (1) gravar o vídeo seguindo o roteiro, (2) rodar o app JCID Doctor e tirar print do relatório
3. **Página única "Como gravar o vídeo"** (nova, conforme pedido) — diagramas fiéis do iPhone (frente, verso, lateral esquerda, lateral direita, base) lado a lado com setas e legendas indicando exatamente o que mostrar e por quanto tempo. Roteiro cronometrado integrado na mesma página.
4. **Checklist estético externo** — uma seção compacta por face do aparelho (frente, verso, laterais, base) com checkboxes (OK / risco leve / risco profundo / amassado / trinca / observação) ao lado de cada diagrama
5. **Diagrama de botões físicos** — ilustração fiel ao iPhone (com Action Button, Camera Control, volume, power, bandeja SIM) com setas e instrução de teste de cada botão
6. **Testes funcionais com JCID Doctor** — link App Store, passo a passo, o que verificar (bateria, Face ID, câmeras, sensores, originalidade de peças), pedir print do relatório
7. **Desativar o Buscar (Find My iPhone)** — único passo de preparação mantido, pois sem isso a avaliação não é confiável. Aviso: avaliação não pode ser feita com Buscar ativado.

**Removido conforme pedido:**
- Roteiro de vídeo isolado (vira página única integrada com diagramas)
- Checklist estético antigo espalhado em várias páginas
- Página de testes visuais da tela (JCID cobre)
- Backup, sair do iCloud, desemparelhar Watch, remover SIM/eSIM, apagar conteúdo, confirmar Bloqueio de Ativação
- Checklist final com assinatura de envio
- Página "Obrigado pela confiança / 24h úteis / contato e envio"

## Diagramas fiéis ao iPhone

Refazer os SVGs com proporções reais (iPhone 15/16 Pro como referência):
- Corpo com cantos arredondados corretos, Dynamic Island na posição certa
- Módulo de câmera traseiro quadrado com 3 lentes + LiDAR + flash no layout real
- Action Button (lateral esquerda, acima do volume) e Camera Control (lateral direita, abaixo do power)
- Bandeja SIM na posição correta (lateral esquerda, abaixo dos botões)
- USB-C centralizado entre grades de alto-falante e microfones na base
- Linhas finas pretas, callouts cinza, mesma linguagem visual da página de suporte da Apple

SVGs ficam em `src/assets/iphone-*.svg` e são embutidos no PDF como vetor via `pdf-lib` (mantendo nitidez em qualquer zoom).

## Arquitetura técnica

- TanStack Start, página única em `src/routes/index.tsx`
- Componentes:
  - `LogoUploader` (FileReader → dataURL, valida tipo/tamanho)
  - `BrandingForm` (nome da loja, instagram opcional, cor de destaque opcional com default `#007AFF`)
  - `ManualPreview` (preview HTML da capa + miniatura dos diagramas)
  - `DownloadButton` (gera PDF e dispara download)
- Geração de PDF: `pdf-lib` (puro JS, roda no browser, sem servidor). Embute o logo (PNG/JPG) e desenha SVGs como paths vetoriais. Texto em Helvetica (built-in do PDF).
- Estado em React local; nada persistido em servidor. Opcional: `localStorage` para lembrar branding entre sessões.
- Sem Lovable Cloud, sem auth, sem banco.

## Design do site

- Estética Apple-like: fundo claro, tipografia limpa (Inter/SF-like), accent `#007AFF`
- Layout split: form à esquerda, preview do PDF à direita (em desktop)
- Mobile: form em cima, preview embaixo, botão de download fixo
- Tokens em `src/styles.css` (oklch)

## Entregáveis

1. Site publicável com gerador funcional
2. Botão extra "Baixar versão sem logo" para você usar como fallback
3. PDF final fica em ~6–7 páginas (em vez de 12), focado só em avaliação

## QA

- Gerar PDF de teste no preview, abrir e conferir cada página (logo posicionado, diagramas nítidos, nada cortado, checkboxes alinhados)
- Testar com logo PNG transparente, JPG e SVG
- Testar com nome de loja curto e longo
