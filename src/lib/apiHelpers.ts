// /src/lib/apiHelpers.ts
import { NextApiResponse } from 'next';

export function successResponse(res: NextApiResponse, data: any) {
  return res.status(200).json({ success: true, data });
}

export function errorResponse(res: NextApiResponse, message: string, status = 500) {
  return res.status(status).json({ success: false, message });
}