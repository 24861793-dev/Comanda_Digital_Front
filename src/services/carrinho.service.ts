import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CartItem {
  dishId: number | string;
  id?: number | string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private items: CartItem[] = [];
  private itemAddedSubject = new Subject<CartItem>();
  // Observable público para componentes escutarem quando um item for adicionado
  itemAdded$ = this.itemAddedSubject.asObservable();
  private itemsChangedSubject = new Subject<CartItem[]>();
  itemsChanged$ = this.itemsChangedSubject.asObservable();

  constructor() { }

  // Normaliza campos do item recebido para { dishId, name, price, quantity }
  private normalize(item: any): CartItem {
    const dishId = item.dishId ?? item.id ?? null;
    const id = item.id ?? dishId;
    const name = item.name ?? item.nome ?? item.title ?? '';
    const priceRaw = item.price ?? item.preco ?? item.valor ?? 0;
    const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw).toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
    const quantity = Number(item.quantity ?? item.quantidade ?? 1) || 1;
    return { dishId, id, name, price, quantity } as CartItem;
  }

  // Adiciona item ao carrinho (memória). Se já existir, incrementa quantity.
  adicionar(item: any) {
    if (!item) return;
    const normalized = this.normalize(item);
    if (normalized.dishId === null || normalized.dishId === undefined) {
      // fallback: gera dishId temporário a partir do name
      normalized.dishId = normalized.id ?? normalized.name;
    }

    const found = this.items.find(i => String(i.dishId) === String(normalized.dishId));
    if (found) {
      found.quantity = Number(found.quantity || 0) + Number(normalized.quantity || 1);
      this.itemAddedSubject.next({ ...found });
      this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
      return;
    }

    const toAdd: CartItem = {
      dishId: normalized.dishId,
      id: normalized.id,
      name: normalized.name,
      price: Number(normalized.price) || 0,
      quantity: Number(normalized.quantity) || 1
    };
    // preserve any image/url fields from the original item if present
    if (item) {
      if (item.image) (toAdd as any).image = item.image;
      if (item.UrlImage) (toAdd as any).UrlImage = item.UrlImage;
      if (item.urlImage) (toAdd as any).urlImage = item.urlImage;
      if (item.urlImagem) (toAdd as any).urlImagem = item.urlImagem;
    }
    this.items.push(toAdd);
    this.itemAddedSubject.next({ ...toAdd });
    this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
  }

  // Retorna cópia dos itens do carrinho com a estrutura padronizada
  listar(): CartItem[] {
    return this.items.map(i => ({ ...i }));
  }

  // Remove um item (por dishId ou id)
  remover(item: any) {
    if (!item) return;
    const targetDishId = item.dishId ?? item.id ?? null;
    if (targetDishId !== null && targetDishId !== undefined) {
      this.items = this.items.filter(i => String(i.dishId) !== String(targetDishId));
      this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
      return;
    }
    // fallback por referência
    const idx = this.items.indexOf(item as CartItem);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
    }
  }

  // Limpa o carrinho
  clear() {
    this.items = [];
    this.itemsChangedSubject.next([]);
  }

  // Atualiza quantidade de um item (por dishId ou referência). Se quantidade <= 0 remove o item.
  atualizarQuantidade(item: any, quantidade: number) {
    if (!item) return;
    const targetDishId = item.dishId ?? item.id ?? null;
    if (targetDishId !== null && targetDishId !== undefined) {
      const found = this.items.find(i => String(i.dishId) === String(targetDishId));
      if (found) {
        const q = Number(quantidade || 0);
        if (q <= 0) {
          this.items = this.items.filter(i => String(i.dishId) !== String(targetDishId));
          this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
          return;
        }
        found.quantity = q;
        this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
        return;
      }
    }
    // fallback por referência
    const idx = this.items.indexOf(item as CartItem);
    if (idx >= 0) {
      const q = Number(quantidade || 0);
      if (q <= 0) {
        this.items.splice(idx, 1);
        this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
        return;
      }
      this.items[idx].quantity = q;
      this.itemsChangedSubject.next(this.items.map(i => ({ ...i })));
    }
  }
}
