import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post("createProfile")
  create(@CurrentUser() user, @Body() dto: CreateProfileDto) {
    return this.profileService.create(user.userId, dto);
  }

  @Get("getProfile")
  get(@CurrentUser() user) {
    return this.profileService.findByUserId(user.userId);
  }

  @Put("updateProfile")
  update(@CurrentUser() user, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(user.userId, dto);
  }

  @Delete("deleteProfile")
  delete(@CurrentUser() user) {
    return this.profileService.delete(user.userId);
  }
}
