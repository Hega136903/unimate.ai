import { Request, Response } from 'express';
export declare const cleanupInvalidVotes: () => Promise<number>;
export declare const getActivePolls: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPollDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const castVote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPollResults: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=votingController.d.ts.map