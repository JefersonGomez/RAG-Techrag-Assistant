# Módulo ShoppingCart

El módulo `ShoppingCart` gestiona el estado y los cálculos de un carrito de compras para pruebas del sistema RAG.

## Características
- **Sin dependencias externas:** Implementado con tipos nativos de TypeScript.
- **Soporte de Cupones:** Permite aplicar códigos promocionales simples (`DESCUENTO10`, `DESCUENTO20`, `PROMO50`).
- **Cálculo de Impuestos:** Aplica automáticamente una tasa fija de IVA del 13%.

## Uso Rápido

```typescript
const cart = new ShoppingCart();

cart.addItem({
  id: 'prod-01',
  name: 'Teclado Mecánico',
  price: 75.00,
  quantity: 1,
  category: 'electronics'
});

const summary = cart.checkout('DESCUENTO10');
console.log(summary.total);