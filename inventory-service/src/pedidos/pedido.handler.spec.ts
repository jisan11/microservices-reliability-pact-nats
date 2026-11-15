import * as path from 'path';

import { Pact } from '@pact-foundation/pact';

import { validarPedidoRecibido } from './pedido.handler';
import type { Pedido } from './pedido.handler';

// Aquí conservaremos el contenido definido en la interacción Pact.
let contenidoContrato: unknown;

const messagePact = new Pact({
  consumer: 'InventoryService',
  provider: 'OrdersService',
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 4,
});

describe('Contrato de mensaje PedidoCreado', () => {
  it('debe aceptar un pedido con la estructura esperada', async () => {
    await messagePact
      .addAsynchronousInteraction()
      .given('existe un pedido válido')
      .expectsToReceive('un evento PedidoCreado', (builder: any) => {
        builder
          .withJSONContent({
            pedidoId: 'PED-100',
            productoId: 'PROD-001',
            cantidad: 2,
          })
          .withMetadata({
            subject: 'pedidos.creados',
          });

        // Recuperamos el contenido directamente de la interacción nativa.
        const mensajeReificado = JSON.parse(
          builder.message.interaction.reifyMessage(),
        );

        const contenidos = mensajeReificado.contents;

        // Aceptamos tanto la estructura directa como la estructura anidada.
        contenidoContrato =
          contenidos &&
          typeof contenidos === 'object' &&
          'content' in contenidos
            ? contenidos.content
            : contenidos;
      })
      .executeTest(async () => {
        if (
          !contenidoContrato ||
          typeof contenidoContrato !== 'object'
        ) {
          throw new Error(
            'No se pudo recuperar el contenido del contrato Pact',
          );
        }

        // Validamos el pedido con la misma función que utiliza Inventory Service.
        validarPedidoRecibido(contenidoContrato as Pedido);
      });
  });
});



