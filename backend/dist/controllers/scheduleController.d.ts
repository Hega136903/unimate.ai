import { Request, Response } from 'express';
export declare const getStudentSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createScheduleItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateScheduleItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteScheduleItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSmartSuggestions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createStudySession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getScheduleAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=scheduleController.d.ts.map