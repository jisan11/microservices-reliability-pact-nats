import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { connect } from '@nats-io/transport-node';
import { jetstream } from '@nats-io/jetstream';

export interface Pedido {
  pedidoId: string;
  productoId: string;
  cantidad: number;
}

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private nc: Awaited<ReturnType<typeof connect>> | null = null;
  private js: ReturnType<typeof jetstream> | null = null;

  private isRunning = true;

  // Inventario de demostración en memoria.
  private readonly stock = new Map<string, number>([
    ['PROD-001', 100],
  ]);

  // Evita procesar dos veces un pedido durante la ejecución del servicio.
  private readonly pedidosProcesados = new Set<string>();

  async onModuleInit(): Promise<void> {
    const servers = process.env.NATS_SERVERS ?? 'nats://localhost:4222';

    this.nc = await connect({ servers });
    this.js = jetstream(this.nc);

    console.log('Inventory Service conectado a NATS JetStream');

    const consumer = await this.js.consumers.get(
      'PEDIDOS',
      'INVENTARIO',
    );

    console.log('Inventory Service escuchando pedidos.creados');

    void (async () => {
      while (this.isRunning) {
        try {
          const message = await consumer.next({ expires: 5000 });

          if (!message) {
            continue;
          }

          const pedido = JSON.parse(
            new TextDecoder().decode(message.data),
          ) as Pedido;

          if (this.pedidosProcesados.has(pedido.pedidoId)) {
            console.log(
              `Pedido duplicado ${pedido.pedidoId}; se evita su reprocesamiento`,
            );
            message.ack();
            continue;
          }

          if (
            !pedido.pedidoId ||
            !pedido.productoId ||
            !Number.isInteger(pedido.cantidad) ||
            pedido.cantidad <= 0
          ) {
            console.error('Pedido recibido con datos inválidos');
            message.term();
            continue;
          }

          const stockActual = this.stock.get(pedido.productoId) ?? 0;
          const stockActualizado = stockActual - pedido.cantidad;

          this.stock.set(pedido.productoId, stockActualizado);
          this.pedidosProcesados.add(pedido.pedidoId);

          console.log(`Pedido recibido: ${pedido.pedidoId}`);
          console.log(`Producto: ${pedido.productoId}`);
          console.log(`Cantidad: ${pedido.cantidad}`);
          console.log(`Stock anterior: ${stockActual}`);
          console.log(`Stock actualizado: ${stockActualizado}`);

          message.ack();

          console.log(
            `Pedido ${pedido.pedidoId} procesado y confirmado en JetStream`,
          );
        } catch (error) {
          if (this.isRunning) {
            console.error('Error al procesar un pedido:', error);
          }
        }
      }
    })();
  }

  async onModuleDestroy(): Promise<void> {
    this.isRunning = false;

    if (this.nc) {
      await this.nc.drain();
      console.log('Inventory Service desconectado de NATS');
    }
  }

  getHello(): string {
    return 'Inventory Service funcionando correctamente';
  }
}