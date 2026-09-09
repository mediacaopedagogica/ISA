# Auditoria técnica — Dupla na Pista v1.1.4

Data: 2026-09-09
Escopo: câmera, orientação, controles, RaycastVehicle, pista física, colisões, performance, arquitetura e automação.

## Diagnóstico executivo
A build atual não deve receber novos ajustes visuais antes de corrigir a base de direção. Há inconsistências de sistema de coordenadas, câmera calculada com vetor oposto, pista física excessivamente segmentada/duplicada e uma automação que valida presença de strings, mas não comportamento.

## Achados críticos

### P0 — Frente física e frente da pista estão em convenções opostas
O chassi nasce com `yaw = atan2(tan.x, tan.z)`, o que alinha o eixo local +Z com a tangente da estrada. Porém `physicsForward()` usa o eixo local -Z. Na largada, portanto, `physicsForward` aponta aproximadamente para o sentido contrário de `f.tan`.

Consequências:
- câmera de corrida pode ficar na frente do veículo;
- sinais de W/S e D/R ficam difíceis de manter coerentes;
- turbo usa o mesmo vetor invertido;
- qualquer ajuste posterior de força do motor vira tentativa e erro.

Correção necessária: escolher UMA convenção de frente para todo o projeto, preferencialmente +Z ou -Z, e aplicá-la a spawn, física, modelo, rodas, câmera, turbo, marcha e HUD.

### P0 — Câmera usa duas referências diferentes
Antes da corrida, `followStart()` usa `f.tan` da pista. Durante a corrida, a câmera usa `physicsForward()`. Como esses vetores estão opostos na build atual, a câmera muda de trás para frente quando o modo de corrida assume o controle.

Correção necessária: CameraController deve receber `vehicleForward` de uma única fonte de verdade e calcular chase camera como `position - forward * distance`.

### P0 — Pista física tem excesso de corpos, sobreposição e costuras
No desktop, cada uma das duas pistas é quebrada em 168 trechos. Cada trecho cria um corpo de estrada e um corpo de proteção, resultando em centenas de corpos estáticos e mais de mil shapes.

Além disso, cada trecho contém:
- uma caixa-base com meia largura 11.5 m (23 m de largura total);
- outra caixa de pista com meia largura 4.74 m.

A caixa-base é muito mais larga que a pista dirigível e se repete em todos os trechos. Nas junções, o veículo pode interagir com múltiplas superfícies/costuras. As proteções também são segmentadas trecho a trecho, o que favorece enganchamento ao raspar em ângulo.

Consequências:
- microtravadas;
- vibração de suspensão;
- sensação de carro preso;
- guard-rail que segura o veículo;
- custo alto de broadphase + raycasts.

Correção necessária: substituir a pista física por uma malha/heightfield/segmentos muito mais longos e sem dupla camada sobreposta; guard-rails precisam de colisores contínuos ou segmentos com sobreposição controlada e extremidades sem quinas de captura.

### P0 — Física em 120 Hz está cara para a quantidade atual de colisores
`world.step(1/120, dt, 8)` roda com substeps enquanto o cenário físico possui centenas de corpos estáticos e oito rodas raycast entre os dois veículos.

Consequência: queda de frame e sensação de falta de fluidez, especialmente em navegador/mobile.

Correção necessária: primeiro reduzir radicalmente a complexidade da pista física; depois medir 60 Hz vs 90/120 Hz. Não aumentar Hz para esconder geometria ruim.

## Achados altos

### P1 — Rodas físicas não são sincronizadas com as rodas visuais
O RaycastVehicle possui rodas com steering e suspensão, porém o GLB visual é movimentado apenas pelo quaternion/posição do chassi. Não há sincronização das rodas visuais com `getWheelTransformWorld()` nem identificação dos meshes das rodas dianteiras.

Consequência: o veículo pode até esterçar fisicamente, mas visualmente as rodas continuam rígidas, fazendo a curva parecer artificial.

Correção necessária: mapear meshes das quatro rodas dos GLBs; girar rodas dianteiras conforme steering e todas conforme rotação/suspensão. Se os GLBs não tiverem nós de roda utilizáveis, usar wrappers/pivôs ou trocar apenas a estrutura do modelo, não o carro aprovado.

### P1 — Orientação visual dos GLBs não é calibrada por veículo
`prepModel()` só verifica se X é maior que Z e pode girar 90°. Isso resolve comprimento/largura, mas não descobre qual ponta é frente. `modelFix` é um quaternion identidade compartilhado pelos dois carros.

Consequência: um modelo pode estar 180° invertido em relação ao outro ou à física.

Correção necessária: `visualYawOffset` por veículo, definido e testado explicitamente.

### P1 — Código de colisão legado está morto e duplica responsabilidade
Existe `resolveVehicleCollision()` baseado em OBB e cópias de `x/z/vx/vz`, mas o loop principal não o chama. Ao mesmo tempo, Cannon já resolve colisão dos chassis.

Consequência: código confuso, estados duplicados e alto risco de uma futura correção mexer na cópia e não no Body real.

Correção necessária: escolher Cannon como única fonte de colisão física e remover a resolução OBB legada, mantendo OBB apenas para sensores/triggers se necessário.

### P1 — Estado do veículo tem campos legados sem função real
Ainda existem `heading`, `latVel`, `yawRate`, `steerAngle`, etc. de versões anteriores, apesar de RaycastVehicle ser a fonte física atual.

Correção necessária: VehicleState deve ser derivado do Body/RaycastVehicle e conter apenas telemetria útil.

## Arquitetura e automação

### P1 — Arquitetura modular existe no repositório, mas a build jogável continua monolítica
Há `event-bus.js`, `race-director-agent.js` e `ARCHITECTURE.md`, porém a página jogável atual não importa esses módulos. Na prática, o agente e o EventBus ainda não governam o jogo.

Correção necessária: migrar de verdade para módulos e deixar o HTML como bootstrap/view.

### P1 — Quality Gate dá falso positivo
O workflow atual só confirma que strings como `RaycastVehicle`, `ArrowUp`, `ArrowDown` e `quickBar` existem e que alguns arquivos de arquitetura existem. Ele não testa:
- W realmente mover para frente;
- câmera estar atrás;
- S virar ré;
- direção esquerda/direita;
- ausência de colisores sobrepostos;
- carro não ficar preso na proteção;
- performance mínima.

Correção necessária: testes comportamentais determinísticos e telemetria de smoke test, não apenas grep/presença de strings.

## Ordem correta de reconstrução
1. Congelar novos recursos visuais.
2. Definir convenção única de eixos e frente.
3. Corrigir visualYawOffset individual dos dois GLBs.
4. Reescrever CameraController usando a mesma frente física.
5. Simplificar completamente os colisores da pista e guard-rails.
6. Limpar VehicleState e remover física legada duplicada.
7. Ajustar RaycastVehicle: massa, centro de massa, rodas, suspensão, grip, steering curve, engine/brake curve.
8. Sincronizar rodas visuais.
9. Criar testes automatizados de direção/câmera/colisão/performance.
10. Só depois retomar cenário, torcida, gado, posto e IA de ambiente.

## Critérios de aceite antes de chamar a direção de pronta
- câmera padrão sempre atrás do carro;
- W/↑ move a frente visual para frente;
- S/↓ freia e entra em ré após parar;
- esquerda/direita produzem arco contínuo sem deslocamento lateral artificial;
- soltar o volante recentraliza progressivamente;
- raspar no guard-rail não prende nem gira o carro 90° instantaneamente;
- colisão entre veículos não atravessa nem congela;
- carro mantém coast ao soltar acelerador;
- sem teleportes durante condução normal;
- frame pacing estável em desktop e mobile alvo;
- testes automatizados falham se qualquer um desses comportamentos inverter.
