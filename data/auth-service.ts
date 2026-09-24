// data/shopping-cart.ts

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'electronics' | 'books' | 'clothing';
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

export class ShoppingCart {
  private items: CartItem[] = [];
  private taxRate: number = 0.13; // 13% IVA

  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe.
   */
  addItem(item: CartItem): void {
    const existingIndex = this.items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }

  /**
   * Elimina un producto del carrito según su ID.
   */
  removeItem(itemId: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== itemId);
    return this.items.length < initialLength;
  }

  /**
   * Aplica un cupón de descuento porcentual al subtotal.
   * @param couponCode Código de descuento (ej: 'DESCUENTO10')
   */
  calculateDiscount(subtotal: number, couponCode?: string): number {
    if (!couponCode) return 0;

    switch (couponCode.toUpperCase()) {
      case 'DESCUENTO10':
        return subtotal * 0.10;
      case 'DESCUENTO20':
        return subtotal * 0.20;
      case 'PROMO50':
        return subtotal * 0.50;
      default:
        return 0;
    }
  }

  /**
   * Genera el resumen final del pedido con impuestos y descuentos.
   */
  checkout(couponCode?: string): OrderSummary {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = this.calculateDiscount(subtotal, couponCode);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * this.taxRate;
    const total = taxableAmount + tax;
    const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      discount,
      tax,
      total,
      itemCount
    };
  }

  /**
   * Vacía todos los elementos del carrito.
   */
  clear(): void {
    this.items = [];
  }
}