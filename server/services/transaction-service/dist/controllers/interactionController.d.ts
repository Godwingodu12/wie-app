import { Request, Response } from 'express';
export declare const toggleLike: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const shareEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const recordView: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const toggleSave: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEventStats: (req: Request, res: Response) => Promise<void>;
export declare const getUserLikedEvents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserSavedEvents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitFeedback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=interactionController.d.ts.map