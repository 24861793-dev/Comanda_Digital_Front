import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'motoboy-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="mb-4 header-root">
      <div class="greeting">Olá, <strong>Motoboy!</strong></div>
      <div class="company">Prato Feito Delivery</div>
    </header>
  `,
  styles: [`
    .header-root{background:#fff;padding:16px 12px;border-bottom:1px solid #eee;position:sticky;top:0;z-index:10}
    .greeting{font-size:1.1rem;color:#111}
    .company{font-size:.95rem;color:#666}
  `]
})
export class MotoboyHeaderComponent {}
