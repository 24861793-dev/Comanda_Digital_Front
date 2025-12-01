import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, retryWhen, switchMap, tap } from 'rxjs/operators';

export type RastreioStatus = 'PENDING' | 'PREPARING' | 'READY' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';

export interface RastreioPayload {
  orderId: string;
  status: RastreioStatus;
  etaMinutes?: number; // estimated minutes remaining
  address?: string;
  total?: number;
  items?: Array<{ name: string; qty: number; price: number }>;
  riderPhone?: string | null;
  updatedAt?: string; // ISO
}

@Injectable({ providedIn: 'root' })
export class RastreioService {
  private ws$?: WebSocketSubject<any>;
  private status$ = new BehaviorSubject<RastreioPayload | null>(null);
  private error$ = new Subject<any>();
  private pollingSub: any;

  /**
   * Observable com o payload mais recente do pedido.
   */
  public readonly rastreio$ = this.status$.asObservable();

  constructor() {}

  /**
   * Inicia o rastreio para `orderId`.
   * Tenta conectar por WebSocket, se falhar faz polling HTTP.
   * @param orderId id do pedido
   * @param options opcional: wsUrl e restUrl (sem trailing slash)
   */
  startTracking(orderId: string, options?: { wsUrl?: string; restUrl?: string; pollingIntervalSec?: number }) {
    const wsUrl = options?.wsUrl ?? this.defaultWsUrl(orderId);
    const restUrl = options?.restUrl ?? this.defaultRestUrl(orderId);
    const pollingInterval = (options?.pollingIntervalSec ?? 8) * 1000;

    // try websocket first
    try {
      this.ws$ = webSocket(wsUrl);
      this.ws$.pipe(
        retryWhen(errors => errors.pipe(switchMap((err) => timer(2000)))),
        catchError(err => {
          this.error$.next(err);
          return of(err as any);
        }),
        tap(msg => {
          if (msg && msg.type === 'rastreio:update') {
            this.status$.next(msg.payload as RastreioPayload);
          } else if (msg && msg.orderId) {
            // accept raw payload
            this.status$.next(msg as RastreioPayload);
          }
        })
      ).subscribe({
        error: (err) => {
          // fallback to polling
          this.startPolling(restUrl, pollingInterval);
        }
      });
    } catch (err) {
      // fallback to polling
      this.startPolling(restUrl, pollingInterval);
    }

    // initial fetch immediately to populate UI
    this.fetchOnce(restUrl).then(payload => { if (payload) this.status$.next(payload); }).catch(()=>{});
  }

  stopTracking(){
    try { this.ws$?.complete(); } catch(e){}
    this.ws$ = undefined;
    if(this.pollingSub){ clearInterval(this.pollingSub); this.pollingSub = undefined; }
    this.status$.next(null);
  }

  private startPolling(restUrl: string, intervalMs: number){
    if(this.pollingSub) return; // already polling
    this.pollingSub = setInterval(()=>{
      this.fetchOnce(restUrl).then(p => { if(p) this.status$.next(p); }).catch(()=>{});
    }, intervalMs);
  }

  private async fetchOnce(restUrl: string): Promise<RastreioPayload | null> {
    try {
      const res = await fetch(restUrl, { headers: { 'Accept': 'application/json' } });
      if(!res.ok) return null;
      const payload = await res.json();
      return payload as RastreioPayload;
    } catch (err){
      this.error$.next(err);
      return null;
    }
  }

  /**
   * Confirmar entrega (rota PATCH /orders/{id}/status?status=DELIVERED)
   */
  async confirmDelivery(orderId: string, options?: { restUrl?: string }){
    const base = options?.restUrl ?? `/orders/${orderId}`;
    const restUrl = `${base}/status?status=DELIVERED`;
    try {
      const res = await fetch(restUrl, { method:'PATCH', headers:{'Content-Type':'application/json'} });
      return res.ok;
    } catch(e){ return false; }
  }

  private defaultWsUrl(orderId: string){
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.hostname || 'localhost';
    return `${protocol}://${host}:8080/ws/orders/${orderId}`;
  }

  private defaultRestUrl(orderId: string){
    // backend OrderController exposes GET /orders/{id}
    // default to backend at localhost:8080 (adjust if your API runs elsewhere)
    const host = location.hostname || 'localhost';
    const proto = location.protocol === 'https:' ? 'https:' : 'http:';
    return `${proto}//${host}:8080/orders/${orderId}`;
  }
}
