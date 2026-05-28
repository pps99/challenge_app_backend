import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing)
      throw new ConflictException("Email or username already taken");

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({ ...dto, password: hash });

    return { id: user._id, email: user.email, username: user.username };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({
      $or: [
        { email: dto.identifier.toLowerCase() },
        { username: dto.identifier },
      ],
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const token = await this.jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return { access_token: token };
  }
}
