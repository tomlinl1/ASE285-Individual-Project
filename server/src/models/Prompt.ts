import mongoose, { type InferSchemaType } from 'mongoose';

const promptSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ['public', 'private'], required: true, default: 'private' },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

promptSchema.index({ visibility: 1, upvotes: -1, updatedAt: -1 });

export type PromptDoc = InferSchemaType<typeof promptSchema> & { _id: mongoose.Types.ObjectId };

export const Prompt = mongoose.models.Prompt ?? mongoose.model('Prompt', promptSchema);

