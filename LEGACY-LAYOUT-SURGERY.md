# Cirurgia do layout legado — Cantinho da Isa

**Status:** em execução  
**Golden Master visual:** `assets/reference/keise-approved-home-final.webp`  
**Regra principal:** corrigir por integração localizada. Não reconstruir o dashboard inteiro e não remover uma função que já esteja funcionando.

## Objetivo

Separar definitivamente a apresentação antiga do motor funcional. O layout legado deve deixar de participar da interface visível, mas seus dados, eventos, painéis e integrações só podem ser removidos depois de transferidos para uma camada técnica independente.

## Fase 0 — Golden Master

Concluída.

A única home visual autorizada para Keise, Isa e Alan é `keiseApprovedHome` + `keiseApprovedTopbar`. A antiga sidebar não pode reaparecer como interface.

## Fase 1 — Conversas e avatares

Em execução com `approved-conversation-surgery-v13.js`.

Problemas identificados no legado:

- o estabilizador antigo removia e reanexava todos os cards de conversa a cada mutação;
- o próprio `MutationObserver` observava as alterações que ele gerava, criando um ciclo de reconstruções;
- o renderer antigo podia esvaziar `kaConversationList` e recriar todos os cards;
- a fonte legada podia apresentar avatar provisório/fallback antes da foto real, fazendo a imagem trocar durante a sessão;
- reordenações sucessivas faziam os botões parecerem trocar de posição.

Correções da cirurgia V13:

- cards da home nova passam a ter identidade estável pela conversa (`conversationId`);
- um card existente é atualizado no lugar, em vez de ser apagado e criado novamente;
- vazios transitórios do motor legado não apagam a lista já visível;
- foto real já carregada é preservada contra fallback transitório;
- ordem das conversas é persistida por perfil;
- conversas fixadas ficam no topo sem reconstrução total da lista;
- o antigo `approved-dashboard-stability-v11.js` tornou-se apenas uma ponte de compatibilidade para a cirurgia V13.

**Critério para encerrar esta fase:** nenhum card pisca, muda de foto sozinho ou troca de posição sem ação real do usuário/dados.

## Contrato temporário do motor legado

Enquanto a extração não terminar, estes elementos podem continuar existindo de forma invisível porque ainda servem como pontos de integração:

- `#chatList`: fonte temporária das conversas;
- `#myAvatar` e `#myName`: identidade do perfil;
- `#logoutBtn`: saída;
- botões de navegação e painéis nativos usados por Calendário, Supervisão, Super Pais e outros módulos;
- eventos e dados produzidos por `app-v34.js`;
- integrações Supabase, permissões, conversas e APIs.

**Nenhum desses elementos autoriza o retorno do layout antigo à tela.**

## Próximas fases

1. Extrair identidade/perfil e avatares para uma camada de estado independente de `#myAvatar`/sidebar.
2. Extrair roteamento de Chat e painéis para APIs diretas, reduzindo a dependência de cliques em botões invisíveis.
3. Validar Calendário, Nossa Rede, Teste, aniversários, capas, Stories, temas, fixadores, status e perfis em Keise, Isa e Alan.
4. Mapear e desativar workflows antigos do GitHub Actions que ainda tentam aplicar correções históricas sobre arquivos atuais.
5. Quando cada consumidor legado tiver substituto confirmado, remover HTML/CSS de apresentação antiga e deixar apenas módulos de motor realmente necessários.
6. Por fim, remover também as pontes temporárias do motor que não tiverem mais consumidores.

## Regra de exclusão

Um arquivo ou trecho legado só pode ser removido quando:

- todos os IDs/eventos/funções que ele fornece estiverem mapeados;
- cada consumidor tiver sido migrado ou comprovadamente não existir mais;
- a função equivalente tiver sido testada no Golden Master;
- a remoção não alterar recursos já aprovados.

## Checklist de não regressão

Antes de cada remoção física do legado, testar:

- Chat e abertura das conversas;
- estabilidade de ordem, fotos e fixadores;
- Calendário;
- Nossa Rede;
- Teste privado da Keise;
- Supervisão e Super Pais;
- aniversários;
- capa de perfil e Stories de 24h;
- tema/cor da Nossa Rede;
- status, humor e atividade;
- editor de imagens, filtros, stickers/emojis, frases, temas festivos e Make;
- perfis e permissões específicas de Keise, Isa e Alan;
- comportamento mobile, tablet e notebook.

## Princípio permanente

> Arrumou uma coisa, não mexa no que já está funcionando.

A cirurgia deve reduzir dependências do legado progressivamente; nunca trocar uma instabilidade por perda de funcionalidades.
