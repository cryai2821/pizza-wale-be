import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Prisma } from '@prisma/client';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get(':shopId/menu')
  async getMenu(@Param('shopId') shopId: string) {
    return this.shopsService.getMenu(shopId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':shopId/admin/menu')
  async getAdminMenu(@Param('shopId') shopId: string) {
    return this.shopsService.getAdminMenu(shopId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':shopId/orders')
  async getOrders(@Param('shopId') shopId: string) {
    return this.shopsService.getOrders(shopId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':shopId/category')
  async createCategory(
    @Param('shopId') shopId: string,
    @Body() data: CreateCategoryDto,
  ) {
    return this.shopsService.createCategory(shopId, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':shopId/product')
  async createProduct(
    @Param('shopId') shopId: string,
    @Body() data: CreateProductDto,
  ) {
    return this.shopsService.createProduct(shopId, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':shopId/product/:productId')
  async updateProduct(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.shopsService.updateProduct(shopId, productId, data);
  }
}
