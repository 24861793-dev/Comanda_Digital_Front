import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MotoboyHeaderComponent } from './motoboy-header.component';
import { DeliveryCardComponent } from './delivery-card.component';
import { DeliveryHistoryListComponent } from './delivery-history-list.component';
import { DeliveryDetailsComponent } from './delivery-details.component';
import { CancelModalComponent } from './cancel-modal.component';
import type { Order } from './order.model';

@Component({
  selector: 'app-motoboy',
  standalone: true,
  imports: [CommonModule, FormsModule, MotoboyHeaderComponent, DeliveryCardComponent, DeliveryHistoryListComponent, DeliveryDetailsComponent, CancelModalComponent],
  templateUrl: './motoboy.component.html',
  styleUrls: ['./motoboy.component.css']
})
export class MotoboyComponent {
  pedidosDisponiveis: Order[] = [
    { id: 145, displayNumber: 'Pedido Nº 00145', date: '30 de nov.', address: 'Rua das Flores, 123 - Centro', items: [{name:'Arroz',quantity:1,price:12}], status: 'PENDING', restaurantAddress: 'R. Cozinha, 10', clientAddress: 'Rua das Flores, 123 - Centro' },
    { id: 144, displayNumber: 'Pedido Nº 00144', date: '30 de nov.', address: 'Av. Brasil, 200 - Bairro Alto', items: [{name:'Feijoada',quantity:2,price:25}], status: 'PENDING', restaurantAddress: 'Av. Cozinha, 5', clientAddress: 'Av. Brasil, 200 - Bairro Alto' }
  ];

  pedidoEmRota: Order | null = {
    id: 146,
    displayNumber: 'Pedido Nº 00146',
    date: '01 de dez.',
    address: 'Rua Verde, 45 - Jardim',
    items: [{name:'Prato feito',quantity:1,price:18}],
    status: 'ON_THE_WAY',
    restaurantAddress: 'R. Mestre Cuca, 20',
    clientAddress: 'Rua Verde, 45 - Jardim'
  };

  entregasRecentes: Order[] = [
    { id: 143, displayNumber: 'Pedido Nº 00143', date: '29 de nov.', address: 'R. Antiga, 10 - Vila', items: [{name:'Bife',quantity:1,price:20}], status: 'DELIVERED' }
  ];

  selectedOrder: Order | null = null;
  showCancel = false;
  cancelTarget: Order | null = null;

  acceptOrder(order: Order){
    // remove from disponíveis
    this.pedidosDisponiveis = this.pedidosDisponiveis.filter(o => o.id !== order.id);
    // if there's an active one, move it to history
    if(this.pedidoEmRota){
      this.entregasRecentes = [this.pedidoEmRota, ...this.entregasRecentes];
    }
    // set as current
    this.pedidoEmRota = {...order, status: 'PENDING'};
  }

  viewDetails(order: Order){ this.selectedOrder = order; }

  closeDetails(){ this.selectedOrder = null; }

  startDelivery(order?: Order | null){
    if(!order) return;
    if(this.pedidoEmRota && this.pedidoEmRota.id === order.id){
      this.pedidoEmRota.status = 'ON_THE_WAY';
    }
    if(this.selectedOrder) this.selectedOrder.status = 'ON_THE_WAY';
    this.closeDetails();
  }

  finishDelivery(order?: Order | null){
    if(!order) return;
    // mark delivered and move to history
    if(this.pedidoEmRota && this.pedidoEmRota.id === order.id){
      this.pedidoEmRota.status = 'DELIVERED';
      this.entregasRecentes = [this.pedidoEmRota, ...this.entregasRecentes];
      this.pedidoEmRota = null;
    }
    this.closeDetails();
  }

  openCancel(order?: Order | null){ this.cancelTarget = order || this.pedidoEmRota; this.showCancel = true; }

  closeCancel(){ this.cancelTarget = null; this.showCancel = false; }

  confirmCancel(){
    if(!this.cancelTarget) return this.closeCancel();
    // reset status and put back in disponíveis
    const o: Order = { ...(this.cancelTarget!), status: 'PENDING' };
    this.pedidosDisponiveis = [o, ...this.pedidosDisponiveis];
    if(this.pedidoEmRota && this.pedidoEmRota.id === this.cancelTarget.id){
      this.pedidoEmRota = null;
    }
    this.closeCancel();
    this.closeDetails();
  }
}

