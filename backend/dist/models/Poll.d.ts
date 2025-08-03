import mongoose, { Document } from 'mongoose';
export interface IPollOption {
    id: string;
    text: string;
    description?: string;
    voteCount?: number;
}
export interface IPoll extends Document {
    title: string;
    description: string;
    options: IPollOption[];
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    isAnonymous: boolean;
    category: 'student-election' | 'campus-decision' | 'feedback';
    createdBy: mongoose.Types.ObjectId;
    totalVotes: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Poll: mongoose.Model<IPoll, {}, {}, {}, mongoose.Document<unknown, {}, IPoll, {}, {}> & IPoll & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Poll;
//# sourceMappingURL=Poll.d.ts.map