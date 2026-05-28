import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsDateString,
} from "class-validator";

export class CreateProfileDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ enum: ["Male", "Female", "Other"] })
  @IsOptional()
  @IsIn(["Male", "Female", "Other"])
  gender?: string;

  @ApiPropertyOptional({ example: "1995-08-28" })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional({ example: 69 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ type: [String], example: ["Music", "Basketball"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
