import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Profile, ProfileDocument } from "./schemas/profile.schema";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { getHoroscope, getZodiac } from "./utils/astrology";

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  private enrich(dto: Partial<CreateProfileDto>) {
    const data: any = { ...dto };
    if (dto.birthday) {
      const date = new Date(dto.birthday);
      data.birthday = date;
      data.horoscope = getHoroscope(date);
      data.zodiac = getZodiac(date);
    }
    return data;
  }

  async create(userId: string, dto: CreateProfileDto) {
    const exists = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (exists)
      throw new ConflictException("Profile already exists, use update");
    return this.profileModel.create({
      userId: new Types.ObjectId(userId),
      ...this.enrich(dto),
    });
  }

  async findByUserId(userId: string) {
    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: this.enrich(dto) },
      { new: true, upsert: false },
    );
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  async delete(userId: string) {
    const result = await this.profileModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
    });
    if (!result) throw new NotFoundException("Profile not found");
    return { deleted: true };
  }
}
