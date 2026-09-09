export class RaceDirectorAgent {
  constructor({eventBus, random=Math.random}={}){
    this.eventBus = eventBus;
    this.random = random;
    this.cooldowns = new Map();
  }

  tick(state, dt){
    if(!state?.race?.running) return;
    this.#decay(dt);
    const zone = state.race.zone;
    const speed = Math.abs(state.vehicle?.speedKmh || 0);

    if(zone === 'Fazendas' && this.#ready('farm', 14) && this.random() < 0.004){
      this.#fire('world:farm-event', {type:'cattle-near-fence', intensity:'low'});
      this.cooldowns.set('farm', 14);
    }

    if((zone === 'Cidade Norte' || zone === 'Cidade Sul') && this.#ready('crowd', 10) && this.random() < 0.005){
      this.#fire('world:crowd-event', {type:'cheer', intensity: speed > 90 ? 'high' : 'medium'});
      this.cooldowns.set('crowd', 10);
    }

    if((state.vehicle?.stuckSeconds || 0) > 5 && this.#ready('assist', 8)){
      this.#fire('driver:assist-suggestion', {type:'recovery-hint'});
      this.cooldowns.set('assist', 8);
    }
  }

  #fire(type, payload){ this.eventBus?.emit(type, payload); }
  #ready(key){ return (this.cooldowns.get(key) || 0) <= 0; }
  #decay(dt){ for(const [k,v] of this.cooldowns) this.cooldowns.set(k, Math.max(0, v-dt)); }
}
