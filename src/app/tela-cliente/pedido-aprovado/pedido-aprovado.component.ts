import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-pedido-aprovado',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pedido-aprovado.component.html',
  styleUrls: ['./pedido-aprovado.component.css']
})
export class PedidoAprovadoComponent {
  order: any = null;
  displayAddressLabel: string = 'Casa';
  displayTotal: string = 'R$0,00';
  private shippingFromState: number | null = null;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    const navState = nav && nav.extras && (nav.extras as any).state ? (nav.extras as any).state : {};
    this.order = navState.order || null;
    this.shippingFromState = navState.shipping !== undefined && navState.shipping !== null ? Number(navState.shipping) : null;
    // Processa order recebido para extrair complemento e total formatado
    if (this.order) {
      try {
        // Extrai o complemento salvo no cliente ou no address (campo `complement`)
        const client = this.order?.client ?? this.order?.clientDTO ?? null;
        const complemento = (client && (client as any).complement) ?? (this.order && (this.order as any).address && (this.order as any).address.complement) ?? '';
        this.displayAddressLabel = String(complemento || '').trim().length > 0 ? String(complemento).trim() : 'Casa';

        // Extrai total: backend pode retornar 'total', 'price', 'amount' ou calcular via items
        const possibleTotals = [(this.order as any).total, (this.order as any).price, (this.order as any).amount, (this.order as any).valor];
        let totalNum: number | null = null;
        for (const t of possibleTotals) {
          if (t !== undefined && t !== null && !isNaN(Number(t))) { totalNum = Number(t); break; }
        }
        // Se não veio total, calcule pelos items
        if (totalNum === null) {
          const items = (this.order as any).items || [];
          let acc = 0;
          for (const it of items) {
            const p = it.price ?? it.unitPrice ?? it.preco ?? it.valor ?? 0;
            const q = it.quantity ?? it.qty ?? it.quantidade ?? 1;
            const pn = Number(p) || 0;
            const qn = Number(q) || 0;
            acc += pn * qn;
          }
          totalNum = acc;
        }
        // Se o backend não persistiu o frete, soma o shipping vindo no state (se existir)
        const backendHasShipping = Boolean((this.order as any).deliveryFee ?? (this.order as any).shipping ?? (this.order as any).frete ?? (this.order as any).shippingValue ?? (this.order as any).taxaEntrega);
        if (this.shippingFromState != null && !backendHasShipping) {
          totalNum = (Number(totalNum) || 0) + Number(this.shippingFromState || 0);
        }
        this.displayTotal = this.formatCurrency(totalNum || 0);
      } catch (e) {
        console.warn('Erro ao processar order em PedidoAprovado:', e);
      }
    }
  }

  rastrear() {
    // Ao navegar para rastreio, passe também o valor do frete (se disponível no state atual)
    const state: any = { order: this.order };
    if (this.shippingFromState != null) state.shipping = this.shippingFromState;
    this.router.navigate(['/cliente/rastreio'], { state });
  }

  fechar() {
    this.router.navigate(['/cliente']);
  }

  private formatCurrency(n: number): string {
    try {
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      // Fallback simples
      return 'R$ ' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
    }
  }
}
