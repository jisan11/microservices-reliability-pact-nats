import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';

import { connect } from '@nats-io/transport-node';
import { jetstream } from '@nats-io/jetstream';
import { crearMensajePedido } from './pedidos/pedido.message';

export interface Pedido {
  pedidoId: string;
  productoId: string;
  cantidad: number;
}

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private nc: Awaited<ReturnType<typeof connect>> | null = null;
  private js: ReturnType<typeof jetstream> | null = null;

  async onModuleInit(): Promise<void> {
    const servers = process.env.NATS_SERVERS ?? 'nats://localhost:4222';

    this.nc = await connect({ servers });
    this.js = jetstream(this.nc);

    console.log('Orders Service conectado a NATS JetStream');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
      console.log('Orders Service desconectado de NATS');
    }
  }

  getHello(): string {
    return 'Orders Service funcionando correctamente';
  }

  async createOrder(pedido: Pedido) {
    if (!this.js) {
      throw new ServiceUnavailableException(
        'No existe conexión con NATS JetStream',
      );
    }

    const mensaje = crearMensajePedido(pedido);
    const payload = new TextEncoder().encode(JSON.stringify(mensaje));

    const ack = await this.js.publish('pedidos.creados', payload);

    console.log(`Pedido ${pedido.pedidoId} publicado en JetStream`);

    return {
      mensaje: 'Pedido publicado correctamente',
      stream: ack.stream,
      secuencia: ack.seq,
      pedido: mensaje,
    };
  }
}