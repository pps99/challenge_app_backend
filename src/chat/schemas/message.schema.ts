import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MessageDocument = HydratedDocument<Message>;

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  receiver: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ index: true })
  conversationId: string; // deterministic: sorted("userA_userB")

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, status: 1, isDeleted: 1 });
