# Cantinho da Isa — Regras de proteção do projeto

> **Regra principal, permanente:** ao corrigir uma coisa, não mexer nem regredir o que já está funcionando.

Este arquivo existe para evitar regressões acidentais no projeto. Qualquer alteração futura deve respeitar estas regras antes de ser publicada.

## 1. Correções devem ser cirúrgicas

- Identificar primeiro o arquivo, função ou módulo realmente responsável pelo defeito.
- Alterar somente o necessário para corrigir aquele problema.
- Não reescrever módulos vizinhos apenas “por garantia”.
- Não trocar estrutura visual, carregadores, boot, roteadores globais ou permissões quando o defeito estiver localizado em outro componente.
- Se uma tentativa nova quebrar algo que já funcionava, a prioridade é reverter essa tentativa antes de empilhar novos remendos.

## 2. Nunca regressar funcionalidades aprovadas

Antes de concluir qualquer correção, verificar que continuam funcionando:

- abertura/login do Cantinho;
- dashboard aprovado dos perfis Keise, Isa e Alan;
- conversas corretas por pessoa, sem trocar destinatário;
- envio e recebimento de mensagens;
- fotos/avatar;
- fixadores;
- Nossa Rede;
- capa do perfil;
- Stories 24h;
- aniversários e respectivas restrições por perfil;
- comentários e emojis;
- calendário;
- Joguinhos;
- Configurações;
- permissões/restrições familiares;
- links externos familiares.

## 3. Não alterar layout aprovado sem pedido explícito

O layout aprovado deve permanecer estável. Ajustes funcionais não podem:

- mudar posição de cards;
- trocar fotos por emoji/letra;
- duplicar conversas;
- fazer conversas pularem de posição;
- fazer o layout antigo reaparecer;
- remover recursos já aprovados;
- reconstruir a interface inteira para resolver um defeito localizado.

## 4. Preservar o motor existente

Ao remover ou substituir layout legado:

- preservar dados, Supabase, eventos, IDs, funções e permissões ainda utilizados;
- desacoplar primeiro o motor da apresentação antiga;
- só excluir fisicamente componentes antigos depois que nenhuma função depender deles.

## 5. Alteração por etapas

Fluxo obrigatório para mudanças sensíveis:

1. localizar a causa;
2. registrar qual arquivo será alterado;
3. preservar o estado funcional atual;
4. fazer a menor mudança possível;
5. comparar antes/depois;
6. validar os módulos principais;
7. só então publicar.

## 6. Regra de confiança do projeto

**Nunca declarar que algo está corrigido se a alteração não tiver sido realmente publicada e verificada.**

Se houver dúvida ou falha de deploy, dizer claramente que a correção ainda não está ativa.

---

Esta regra foi registrada no repositório por solicitação da responsável pelo projeto e deve ser tratada como requisito permanente do Cantinho da Isa.