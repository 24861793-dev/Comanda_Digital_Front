import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RastreioService, RastreioPayload } from '../../../services/rastreio.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rastreio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rastreio.component.html',
  styleUrls: ['./rastreio.component.css']
})
export class RastreioComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private rastreioService = inject(RastreioService);
  private sub = new Subscription();

  orderId?: string | null;
  rastreio?: RastreioPayload | null = null;

  ngOnInit(): void {
    // First, try navigation state (PedidoAprovado passes the order via state)
    const navState = (window && (window as any).history && (window as any).history.state) ? (window as any).history.state.order : null;
    if (navState && (navState.id || navState.orderId)) {
      const id = String(navState.id ?? navState.orderId);
      this.orderId = id;
      // populate initial UI using the passed order object (non-exhaustive mapping)
      this.rastreio = {
        orderId: id,
        status: (navState.status as any) ?? 'PENDING',
        etaMinutes: navState.etaMinutes ?? null,
        address: navState.address_snapshot || navState.address || navState.address_snapshot_text || navState.client_address || '',
        total: navState.total ?? navState.price ?? navState.amount ?? null,
        items: (navState.items || navState.orderItems || []).map((it: any) => ({ name: it.name || it.dishName || 'Item', qty: it.quantity ?? it.qty ?? 1, price: it.price ?? it.unitPrice ?? it.valor ?? 0 })),
        riderPhone: navState.riderPhone ?? null,
        updatedAt: navState.moment ?? navState.updatedAt ?? null
      } as RastreioPayload;
      // Start listening to backend updates
      this.rastreioService.startTracking(this.orderId);
    } else {
      // Try to read orderId from route param `id` or query `orderId`
      this.orderId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('orderId');
      if (this.orderId) {
        this.rastreioService.startTracking(this.orderId);
      }
    }

    this.sub.add(this.rastreioService.rastreio$.subscribe(v => this.rastreio = v));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.orderId) this.rastreioService.stopTracking();
  }

  async confirmDelivery(){
    if(!this.orderId) return;
    const ok = await this.rastreioService.confirmDelivery(this.orderId);
    if(ok){
      // optimistic: update local status
      if(this.rastreio) this.rastreio.status = 'DELIVERED';
    }
  }

  callRider(){
    if(!this.rastreio?.riderPhone) return;
    // for mobile, open tel: link
    window.location.href = `tel:${this.rastreio.riderPhone}`;
  }
}
