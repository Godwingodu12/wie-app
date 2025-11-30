import { Request, Response } from 'express';
export declare const getGroupBookings: (req: Request, res: Response) => Promise<void>;
export declare const getEventStatistics: (req: Request, res: Response) => Promise<void>;
export declare const verifyTicketQR: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEventFeedback: (req: Request, res: Response) => Promise<void>;
export declare const exportBookings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBookingAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTopEventsByRevenue: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map