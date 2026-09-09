export class EventBus {
  constructor(){ this.listeners = new Map(); }
  on(type, handler){
    if(!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
    return () => this.off(type, handler);
  }
  off(type, handler){ this.listeners.get(type)?.delete(handler); }
  emit(type, payload){ this.listeners.get(type)?.forEach(fn => fn(payload)); }
  clear(){ this.listeners.clear(); }
}
