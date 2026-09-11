# Referência visual aprovada — Keise, Isa e Alan

**Status: FINAL / CANÔNICA / GOLDEN MASTER**

A tela inicial aprovada é a referência visual armazenada em:

`assets/reference/keise-approved-home-final.webp`

Esta imagem é a referência permanente do layout. A composição visual não pode ser substituída por versões anteriores nem reconstruída por módulos auxiliares.

## Regras obrigatórias do shell

- `keiseApprovedHome` + `keiseApprovedTopbar` formam o único dashboard visual aprovado para Keise, Isa e Alan; mudam apenas identidade, permissões e recursos liberados para cada perfil.
- O `app-v34`, a antiga sidebar e os elementos legados podem existir somente enquanto forem necessários como **motor funcional invisível**. Eles nunca podem voltar a ser a tela inicial visível.
- A remoção definitiva do layout legado deve ser feita por extração do motor: preservar IDs, eventos, dados, painéis, conversas, permissões, Supabase e APIs; retirar apenas marcação/estilos de apresentação antigos. Nunca apagar o motor junto com o layout.
- Para Keise, o dashboard aprovado contém: Chat, Calendário, Nossa Rede, Teste, Supervisão, Super Pais, Meu acesso, Meu perfil e Configurações, seguido da área de Conversas.
- Isa e Alan usam a mesma composição visual e responsiva, exibindo somente os recursos realmente permitidos para cada perfil.
- Abrir uma conversa ou módulo não pode reconstruir, substituir, mover ou congelar o dashboard aprovado. O núcleo abre o painel e o shell apenas alterna entre modo início e modo painel.
- Não pode existir polling de reconstrução visual nem um segundo dashboard concorrente.
- Foto real de perfil tem prioridade sobre emoji/fallback. Um avatar já carregado não pode desaparecer ou trocar sozinho durante a sessão.
- A ordem das conversas e os fixadores são por perfil e devem permanecer estáveis. O fixador deve ficar preso ao card da conversa e nunca aparecer solto na página.
- Aniversários já cadastrados continuam visíveis nos espaços aprovados e não podem desaparecer por causa do shell novo.
- O botão **Teste** da Keise deve abrir a área privada de testes sem depender do menu legado visível.

## Nossa Rede — composição canônica protegida

Esta estrutura passa a ser **fixa** para Keise, Isa, Alan e todos os acessos familiares autorizados. Novas funções não podem alterar a ordem nem substituir estes blocos:

1. barra superior / busca da **Nossa Rede**;
2. **capa do perfil** no topo da coluna central, ocupando o espaço nobre que anteriormente era usado pelos Stories;
3. **Stories • 24h** imediatamente abaixo da capa;
4. compositor de publicação;
5. feed.

Regras adicionais:

- a capa usa o mesmo `cover_ref` já existente; não criar um segundo sistema de capa;
- a orientação exibida junto da capa é **Ideal: 1600 × 600 px**, mantendo o conteúdo importante centralizado para o corte responsivo;
- o upload/edição da capa continua usando o editor de mídia já aprovado;
- Stories permanecem com expiração real de 24 horas e apenas mudam de posição para abaixo da capa;
- a escolha de cor/tema deve alterar a **Nossa Rede como conjunto**, incluindo fundo do shell, barra superior, superfícies principais e detalhes, sem deslocar nenhum elemento;
- mudar tema, capa ou Story nunca pode reordenar publicações, conversas, cards, aniversários ou outros componentes;
- a composição `capa > Stories 24h > compositor > feed` está protegida por `nossa-rede-cover-story-lock-v16.js` e não pode ser revertida por módulos posteriores.

## Recursos globais que não podem regredir

Estes recursos são para os perfis autorizados da família, não apenas para um usuário específico:

- opção de **capa de perfil** na Nossa Rede;
- **Stories de 24 horas**;
- escolha de **cor/tema para a Nossa Rede inteira**, e não somente para um botão;
- **fixadores personalizados** de conversa;
- status, humor e atividade;
- editor de fotos/imagens com filtros, ajustes visuais, emojis/stickers, dizeres/frases, temas de aniversário/festa/corações/flores/Natal/Ano Novo e aba **Make** com presets e detalhes cosméticos divertidos;
- recursos já funcionais não podem ser removidos para corrigir outro recurso.

## Regra de manutenção sem regressão

**Arrumou uma coisa, não mexa no que já está funcionando.** Toda correção deve ser aditiva ou localizada, preservar funções existentes e evitar reescrever o dashboard inteiro. Antes de remover código legado, confirmar se ele ainda fornece algum ID, evento ou função consumida pelo motor.

Novas funcionalidades devem ser integradas sobre esta referência, sem recriar uma home alternativa.

Referência aprovada pela usuária em 11/09/2026 e reforçada como Golden Master em 11/09/2026.
