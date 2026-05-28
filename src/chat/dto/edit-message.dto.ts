import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString, MaxLength, MinLength } from "class-validator";

export class EditMessageDto {
  @ApiProperty({ example: "6656f89a7c6a5342e82d4f01" })
  @IsMongoId()
  messageId: string;

  @ApiProperty({ example: "Updated message text" })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
