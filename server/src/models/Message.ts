import mongoose, { type InferSchemaType } from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    model: { type: String, default: '' },
    content: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ chatRoomId: 1, createdAt: 1 });

export type MessageDoc = InferSchemaType<typeof messageSchema> & { _id: mongoose.Types.ObjectId };

export const Message = mongoose.models.Message ?? mongoose.model('Message', messageSchema);

