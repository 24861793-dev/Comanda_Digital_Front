import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cancel-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="visible" (click)="$event.target===$event.currentTarget && onClose()">
      <section class="box">
        <h3>Confirmar cancelamento</h3>
        <p>Deseja realmente cancelar esta entrega? O pedido voltará para disponíveis.</p>
        <div class="actions">
          <button class="btn" (click)="onClose()">Cancelar</button>
          <button class="btn confirm" (click)="confirm.emit()">Confirmar</button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center}
     .box{background:#fff;padding:16px;border-radius:10px;max-width:420px}
     .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
     .btn{padding:8px 12px;border-radius:8px;border:none}
     .confirm{background:#ef4444;color:#fff}
    `
  ]
})
export class CancelModalComponent {
  @Input() visible = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onClose(){ this.close.emit(); }
}
