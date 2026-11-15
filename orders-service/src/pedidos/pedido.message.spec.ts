import * as path from 'path';

import {
  MessageProviderPact,
  providerWithMetadata,
} from '@pact-foundation/pact';

import { crearMensajePedido } from './pedido.message';

// Configuración de verificación del proveedor Orders Service.
const providerPact = new MessageProviderPact({
  provider: 'OrdersService',
  providerVersion: '1.0.0',

  pactUrls: [
    path.resolve(
      process.cwd(),
      'pacts',
      'InventoryService-OrdersService.json',
    ),
  ],

  // Relacionamos la descripción del contrato
  // con la función que genera el mensaje real.
  messageProviders: {
    'un evento PedidoCreado': providerWithMetadata(
      () =>
        crearMensajePedido({
          pedidoId: 'PED-100',
          productoId: 'PROD-001',
          cantidad: 2,
        }),
      {
        contentType: 'application/json',
        subject: 'pedidos.creados',
      },
    ),
  },
});

describe('Verificación del proveedor Orders Service', () => {
  it('debe generar un mensaje compatible con el contrato de Inventory Service', async () => {
    await providerPact.verify();
  });
});
