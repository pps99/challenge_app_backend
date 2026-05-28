import { Type } from "class-transformer";
import { IsMongoId, IsOptional, IsInt, Min, Max } from "class-validator";

export class ViewMessagesDto {
    @IsMongoId() withUserId: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 50;
}