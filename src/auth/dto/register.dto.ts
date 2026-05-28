import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'johndoe@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'johndoe123' })
    @IsString()
    @MinLength(3)
    @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username: letters, numbers, underscore only' })
    username: string;

    @ApiProperty({ example: 'StrongPass123!' })
    @IsString()
    @MinLength(8)
    password: string;
}