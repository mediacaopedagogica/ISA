# Dupla na Pista — Arquitetura Profissional

## Objetivo
Migrar o jogo de um HTML monolítico para uma arquitetura modular, testável e evolutiva, preservando o GitHub Pages e o modo de teste privado.

## Princípios
- O jogador sempre controla o próprio carro. Nenhum agente de IA dirige por Isa ou pelo primo.
- Física, entrada, interface, áudio, corrida, multiplayer e eventos ficam separados.
- Estado do jogo centralizado e previsível.
- UI responsiva orientada a mobile-first.
- Eventos de corrida dirigidos por um agente de IA local determinístico, sem acesso a dados pessoais.
- Automação de qualidade antes de publicação.

## Camadas

### 1. Core
- GameLoop
- GameState
- EventBus
- SceneManager
- ResourceManager

### 2. Vehicle
- VehicleController
- VehiclePhysics
- SteeringModel
- Transmission
- DamageModel
- CollisionRecovery

### 3. Input
- KeyboardInput
- TouchInput
- GamepadInput
- InputMapper

### 4. Race
- RaceSession
- Checkpoints
- Laps
- RouteManager
- StartSequence
- PitStop / GasStation

### 5. AI Agent
RaceDirectorAgent não dirige carros. Ele apenas coordena eventos do mundo e dificuldade.

Responsabilidades:
- selecionar eventos ambientais compatíveis com o trecho;
- controlar intensidade de torcida e ambientação;
- acionar gado/fazendas em regiões apropriadas;
- recomendar redução de dificuldade quando o jogador trava repetidamente;
- registrar telemetria técnica para depuração;
- nunca tomar controle de direção, acelerador, freio ou ré.

### 6. Presentation
- HUD
- TopToolbar
- MobileControls
- CameraController
- AudioManager
- ParticleManager

### 7. Multiplayer
- RoomService
- PlayerIdentity
- StateSync
- VoiceChannel
- Presence

O multiplayer deve sincronizar estado, nunca substituir input local.

## Fluxo de controle
Input -> VehicleController -> VehiclePhysics -> GameState -> Render/HUD

RaceDirectorAgent observa GameState e EventBus e publica somente eventos de mundo.

## Automação
GitHub Actions deve validar:
- presença de controles frente/ré corretos;
- ausência de autopilot do segundo jogador;
- versão da build;
- existência da barra superior responsiva;
- sintaxe básica do HTML/JS;
- arquivos essenciais da arquitetura.

## Migração
1. estabilizar física e controles no HTML atual;
2. extrair InputManager;
3. extrair VehicleController/VehiclePhysics;
4. extrair HUD/TopToolbar;
5. extrair RaceDirectorAgent;
6. adicionar multiplayer real;
7. remover código legado do HTML.
