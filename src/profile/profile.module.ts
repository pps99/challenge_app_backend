import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Profile, ProfileSchema } from "./schemas/profile.schema";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    AuthModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
