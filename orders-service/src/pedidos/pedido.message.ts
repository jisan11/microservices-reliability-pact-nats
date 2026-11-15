export interface Pedido {
  pedidoId: string;
  productoId: string;
  cantidad: number;
}

/**
 * Construye el evento PedidoCreado que publica Orders Service.
 */
export function crearMensajePedido(pedido: Pedido): Pedido {
  return {
    pedidoId: pedido.pedidoId,
    productoId: pedido.productoId,
    cantidad: pedido.cantidad,
  };
}
