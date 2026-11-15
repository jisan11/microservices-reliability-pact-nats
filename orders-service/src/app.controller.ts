import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { AppService } from './app.service';
import type { Pedido } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('orders')
  async createOrder(@Body() pedido: Pedido) {
    if (
      !pedido.pedidoId ||
      !pedido.productoId ||
      !Number.isInteger(pedido.cantidad) ||
      pedido.cantidad <= 0
    ) {
      throw new BadRequestException(
        'Debe proporcionar pedidoId, productoId y una cantidad mayor a cero',
      );
    }

    return this.appService.createOrder(pedido);
  }
}
