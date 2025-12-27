import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}

export class CreateOptionGroupDto {
  @IsString()
  name: string; // e.g., "Size", "Toppings"

  @IsNumber()
  @IsOptional()
  minSelect?: number;

  @IsNumber()
  @IsOptional()
  maxSelect?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsString()
  categoryId: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionGroupDto)
  options?: CreateOptionGroupDto[];
}
