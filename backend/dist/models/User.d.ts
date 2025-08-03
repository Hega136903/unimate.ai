import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'admin' | 'faculty';
    university: string;
    studentId?: string;
    department?: string;
    year?: number;
    profilePicture?: string;
    isActive: boolean;
    lastLogin?: Date;
    preferences: {
        notifications: boolean;
        darkMode: boolean;
        language: string;
    };
    aiUsage: {
        questionsAsked: number;
        studySessionsCreated: number;
        lastUsed?: Date;
    };
    portfolio?: {
        personalInfo: {
            fullName: string;
            email: string;
            phone: string;
            location: string;
            summary: string;
            bio: string;
            avatar?: string;
            website?: string;
            linkedin?: string;
            github?: string;
        };
        projects: Array<{
            id?: string;
            title: string;
            description: string;
            techStack: string[];
            githubUrl?: string;
            liveUrl?: string;
            imageUrl?: string;
            createdAt?: Date;
        }>;
        skills: Array<{
            id?: string;
            name: string;
            level: number;
            category: string;
        }>;
        achievements: Array<{
            id?: string;
            title: string;
            description: string;
            date: string;
            certificateUrl?: string;
            issuer: string;
        }>;
        isPublic: boolean;
        username: string;
        createdAt?: Date;
        updatedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getFullName(): string;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map