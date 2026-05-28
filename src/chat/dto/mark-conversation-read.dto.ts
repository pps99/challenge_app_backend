import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export class MarkConversationReadDto {
  @ApiProperty({ example: "507f1f77bcf86cd799439012" })
  @IsMongoId()
  withUserId: string;
}
