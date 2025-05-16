// /src/lib/apiLogger.ts
import { NextApiRequest, NextApiResponse } from 'next';

export function withErrorLogging(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`API Error [${req.method} ${req.url}]:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
}