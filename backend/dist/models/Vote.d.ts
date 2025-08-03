import mongoose, { Document } from 'mongoose';
export interface IVote extends Document {
    voterId: string;
    pollId: string;
    optionId: string;
    timestamp: Date;
    isAnonymous: boolean;
    ipAddress?: string;
}
declare const _default: mongoose.Model<IVote, {}, {}, {}, mongoose.Document<unknown, {}, IVote, {}, {}> & IVote & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Vote.d.ts.map