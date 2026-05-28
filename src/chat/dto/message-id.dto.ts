import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export class MessageIdDto {
  @ApiProperty({ example: "6656f89a7c6a5342e82d4f01" })
  @IsMongoId()
  messageId: string;
}
