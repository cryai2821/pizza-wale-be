import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { OrdersService, UserPayload } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(IdempotencyInterceptor)
  @Post()
  async createOrder(
    @Body() data: CreateOrderDto,
    @Request() req: { user: UserPayload },
  ) {
    return this.ordersService.createOrder(data, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-orders')
  async getMyOrders(@Request() req: { user: UserPayload }) {
    return this.ordersService.getUserOrders(req.user.sub);
  }

  @Get(':orderId')
  async getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrder(orderId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':orderId/status')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(orderId, status);
  }
}
