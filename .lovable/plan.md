## Diagnóstico dos bugs nos diagramas

Olhei o arquivo `src/lib/pdf-manual.ts` (funções `drawPhoneLeftSide`, `drawPhoneRightSide`, `drawPhoneBack`) e identifiquei a causa exata do "bloco preto" e dos elementos saindo do quadrado.

### Causa 1 — Botões laterais viram um bloco preto sólido

Nas laterais esquerda e direita, os botões são desenhados como retângulos pretos grandes que **se sobrepõem** porque as posições foram pensadas para um phone alto (página de gravação) mas reaproveitadas no checklist com altura menor. Exemplos:

- Lateral esquerda: Action Button (h=10) em `y+0.78h`, Volume+ (h=20) em `y+0.62h`, Volume− (h=20) em `y+0.50h`. Os topos passam por cima dos próximos botões e os três viram uma única barra preta.
- Lateral direita: Power (h=32) em `y+0.68h` + Camera Control (h=14) em `y+0.45h` — quase metade da lateral fica preta sólida.

Além disso, os botões usam `x - 2.5` com `width: w + 5`, o que faz a barra preta **sair do retângulo do card** do checklist (extrapola para a esquerda/direita).

### Causa 2 — Traseira com 3 câmeras

A função `drawPhoneBack` desenha o módulo quadrado do iPhone 15/16 Pro (3 lentes + LiDAR + flash). Você quer o **iPhone 17 padrão**: barra de câmera horizontal em pílula com 2 lentes.

---

## O que vou alterar (só `src/lib/pdf-manual.ts`)

### 1. Redesenhar a traseira (estilo iPhone 17)

- Remover o bump quadrado, LiDAR e a 3ª lente.
- Desenhar uma **barra horizontal em pílula** no topo do verso (largura ~58% do corpo, altura ~16%), cantos totalmente arredondados.
- Dentro da pílula: **2 lentes circulares** lado a lado + um pequeno flash discreto à direita (pontinho cinza claro).
- Manter MagSafe e logo da Apple no centro.

### 2. Redesenhar os botões das laterais (sem sobreposição, dentro do card)

- **Lateral esquerda**: Action Button pequeno (h≈6), espaço, Volume+ (h≈12), gap nítido, Volume− (h≈12). Posições em proporções que não se tocam mesmo com `h=110`.
- **Lateral direita**: Power (h≈18) no topo, gap, Camera Control (h≈8) na metade inferior — sem sobrepor.
- **Botões deixam de protruir para fora**: usar `x - 1.2` e `width: w + 2.4` (suficiente para indicar volume, sem invadir o card).
- Bandeja do SIM: tracinho fino mais discreto, claramente abaixo dos botões.

### 3. QA

Após a alteração eu vou:

1. Gerar um PDF de amostra com `bun` rodando o gerador.
2. Converter cada página para imagem com `pdftoppm`.
3. Inspecionar visualmente a página "Como gravar o vídeo" e cada card do "Checklist estético externo" para confirmar:
   - Nenhum bloco preto sólido.
   - Botões dentro do card.
   - Traseira com 2 lentes no formato pílula horizontal.
4. Iterar até estar limpo.

Nada na UI do site muda — só o desenho dentro do PDF.