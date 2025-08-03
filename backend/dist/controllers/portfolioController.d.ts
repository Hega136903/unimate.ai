import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
}
export declare const createPortfolio: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPortfolio: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePortfolio: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deletePortfolio: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPublicPortfolio: (req: Request, res: Response) => Promise<void>;
export declare const addProject: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProject: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteProject: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addSkill: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteSkill: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addAchievement: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteAchievement: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllPublicPortfolios: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=portfolioController.d.ts.map