import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId: Types.ObjectId;

  @Prop() displayName?: string;
  @Prop({ enum: ["Male", "Female", "Other"] }) gender?: string;
  @Prop() birthday?: Date;
  @Prop() horoscope?: string;
  @Prop() zodiac?: string;
  @Prop() heightCm?: number;
  @Prop() weightKg?: number;
  @Prop() about?: string;
  @Prop({ type: [String], default: [] }) interests: string[];
  @Prop() imageUrl?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
