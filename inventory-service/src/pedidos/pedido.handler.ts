export interface Pedido {
  pedidoId: string;
  productoId: string;
  cantidad: number;
}

/**
 * Valida la estructura y los datos mínimos
 * del evento PedidoCreado recibido por Inventory Service.
 */
export function validarPedidoRecibido(pedido: Pedido): void {
  if (
    !pedido.pedidoId ||
    !pedido.productoId ||
    !Number.isInteger(pedido.cantidad) ||
    pedido.cantidad <= 0
  ) {
    throw new Error(
      'El mensaje PedidoCreado contiene datos inválidos',
    );
  }
}
