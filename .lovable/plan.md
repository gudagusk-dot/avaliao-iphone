# Manual de Inspeção de iPhone — PDF com diagramas estilo Apple

PDF profissional em português gerado com ReportLab, com **diagramas ilustrativos do iPhone** semelhantes aos da página de referência da Apple (support.apple.com/101944), indicando botões físicos, lentes, conectores e áreas a inspecionar.

Output: `/mnt/documents/manual-inspecao-iphone.pdf`

## Diagramas a incluir
Ilustrações vetoriais do iPhone desenhadas diretamente no PDF via ReportLab, com **linhas de chamada (callouts) e rótulos** no estilo Apple:

1. **Vista frontal** — Dynamic Island/notch, câmera frontal, tela, alto-falante superior
2. **Vista traseira** — módulo de câmeras (cada lente rotulada: principal, ultra-wide, tele, LiDAR, flash), logo Apple, MagSafe
3. **Lateral esquerda** — switch mute / Action Button, volume up, volume down, bandeja SIM
4. **Lateral direita** — botão lateral (power), Camera Control (15/16 Pro)
5. **Base** — conector USB-C/Lightning, alto-falantes, microfones
6. **Diagrama de botões físicos** — setas indicando "pressione e segure", "pressione uma vez", estilo Apple

Cada diagrama acompanha uma checklist do que verificar.

## Estrutura completa do PDF (~12 páginas)

1. **Capa** — placeholder editável para logo + título + campos cliente/IMEI/data
2. **Como usar** — fluxo de 3 passos (vídeo → app JCID → checklist final)
3. **Roteiro de vídeo cronometrado** (2–3 min, cena por cena com tempo sugerido)
4. **Checklist estético externo** — uma página por face do aparelho, cada uma com **diagrama do iPhone** + checklist (OK / risco leve / risco profundo / amassado / trinca / observação)
5. **Testes de tela visuais** — pixels mortos, burn-in, linhas, touch, True Tone, brilho automático (instruções de fundo sólido)
6. **Diagrama de botões físicos** — ilustração estilo Apple mostrando cada botão com seta + instrução de teste (pressionar, segurar, liga/desliga, screenshot, modo silencioso, Action Button)
7. **Testes funcionais com JCID Doctor** — recomendação do app (link App Store), passo a passo de instalação e execução, o que verificar no relatório completo (bateria, Face ID, câmeras, sensores, conectores, originalidade de peças), pedir print do relatório

   *(Removido o bloco de testes manuais — o JCID cobre Face ID, câmeras, áudio, conectividade, sensores, vibração e carregamento.)*

8. **Preparação para envio — resetar o iPhone** (NOVO)
   Passo a passo ilustrado para o cliente remover a conta e zerar o aparelho antes de enviar:
   - **Fazer backup** (iCloud ou computador) — instruções rápidas
   - **Desativar o Buscar (Find My iPhone)**: Ajustes → [seu nome] → Buscar → Buscar iPhone → desativar (vai pedir senha do Apple ID)
   - **Sair do iCloud / Apple ID**: Ajustes → [seu nome] → role até o final → Sair → digitar senha do Apple ID → confirmar
   - **Desemparelhar Apple Watch** (se houver)
   - **Remover cartão SIM / eSIM**
   - **Apagar conteúdo e configurações**: Ajustes → Geral → Transferir ou Redefinir iPhone → Apagar Conteúdo e Configurações → seguir até a tela "Olá"
   - **Confirmar Bloqueio de Ativação removido**: ao final, o iPhone deve iniciar na tela inicial de configuração, sem pedir Apple ID anterior
   - Aviso destacado: **iPhone com Buscar ativado ou Apple ID logado NÃO pode ser avaliado/comprado**

9. **Checklist final + assinatura** — resumo, observações gerais, assinatura/data

## Design
- Helvetica + accent azul (#007AFF estilo Apple)
- Diagramas em linha fina preta com callouts cinza
- Cabeçalho com placeholder de logo em todas as páginas
- Rodapé com numeração
- Checkboxes desenhados (□) para preenchimento

## QA
Após gerar, converter cada página em JPG (pdftoppm) e inspecionar visualmente: nada cortado, diagramas legíveis, rótulos sem sobreposição, espaçamento consistente.
