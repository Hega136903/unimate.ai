import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'faculty'],
      default: 'student',
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true,
    },
    studentId: {
      type: String,
      sparse: true, // Allow multiple null values
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: [1, 'Year must be at least 1'],
      max: [8, 'Year cannot exceed 8'],
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: 'en',
      },
    },
    aiUsage: {
      questionsAsked: {
        type: Number,
        default: 0,
      },
      studySessionsCreated: {
        type: Number,
        default: 0,
      },
      lastUsed: {
        type: Date,
      },
    },
    portfolio: {
      personalInfo: {
        fullName: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        location: { type: String, default: '' },
        summary: { type: String, default: '' },
        bio: { type: String, default: '' },
        avatar: { type: String, default: '' },
        website: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
      },
      projects: [{
        id: { type: String },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        techStack: [{ type: String }],
        githubUrl: { type: String, default: '' },
        liveUrl: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        createdAt: { type: Date },
      }],
      skills: [{
        id: { type: String },
        name: { type: String, default: '' },
        level: { type: Number, default: 0 },
        category: { type: String, default: '' },
      }],
      achievements: [{
        id: { type: String },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        date: { type: String, default: '' },
        certificateUrl: { type: String, default: '' },
        issuer: { type: String, default: '' },
      }],
      isPublic: { type: Boolean, default: false },
      username: { type: String, default: '' },
      createdAt: { type: Date },
      updatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ university: 1, studentId: 1 });

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name method
UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

export const User = mongoose.model<IUser>('User', UserSchema);
