import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsMongoId, IsOptional, IsInt, Min, Max } from "class-validator";

export class ViewMessagesDto {
  @ApiPropertyOptional({ example: "507f1f77bcf86cd799439012" })
  @IsMongoId()
  withUserId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
