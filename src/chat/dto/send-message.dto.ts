import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString, MinLength, MaxLength } from "class-validator";

export class SendMessageDto {
  @ApiProperty({ example: "507f1f77bcf86cd799439012" })
  @IsMongoId()
  receiverId: string;

  @ApiProperty({ example: "Hello from user A" })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
