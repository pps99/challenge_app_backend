import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, Matches } from "class-validator";

export const PASSWORD_MIN_LENGTH = 8;

export class RegisterDto {
  @ApiProperty({ example: "johndoe@gmail.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "johndoe123" })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Username: letters, numbers, underscore only",
  })
  username: string;

  @ApiProperty({ example: "StrongPass123!", minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  })
  password: string;
}
