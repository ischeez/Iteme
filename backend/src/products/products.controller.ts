import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@ApiTags('Продукты')
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(Role.SELLER)
  create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.create(req.user.userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  findMyProducts(@Request() req: { user: { userId: string } }) {
    return this.productService.findMine(req.user.userId);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('cart/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  getMyCart(@Request() req: { user: { userId: string } }) {
    return this.productService.getMyCart(req.user.userId);
  }

  @Post(':id/cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  addToCart(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productService.addToCart(id, req.user.userId);
  }

  @Delete(':id/cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  removeFromCart(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productService.removeFromCart(id, req.user.userId);
  }

  @Get(':id/cart-buyers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  getCartBuyers(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string; role: Role } },
  ) {
    return this.productService.getCartBuyers(id, req.user.userId, req.user.role);
  }

  @Post(':id/mark-sold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  markAsSold(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string; role: Role } },
    @Body('buyerId') buyerId: string,
  ) {
    return this.productService.markAsSold(id, buyerId, req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string; role: Role } },
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, req.user.userId, req.user.role, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string; role: Role } },
  ) {
    return this.productService.remove(id, req.user.userId, req.user.role);
  }

  @Post(':id/buy-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER, Role.ADMIN)
  createBuyIntent(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productService.createBuyIntent(id, req.user.userId);
  }
}
