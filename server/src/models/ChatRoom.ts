import mongoose, { type InferSchemaType } from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  },
  { timestamps: true }
);

chatRoomSchema.index({ participants: 1, updatedAt: -1 });

export type ChatRoomDoc = InferSchemaType<typeof chatRoomSchema> & { _id: mongoose.Types.ObjectId };

export const ChatRoom =
  mongoose.models.ChatRoom ?? mongoose.model('ChatRoom', chatRoomSchema);

