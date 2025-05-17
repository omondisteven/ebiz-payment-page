// src/actions/stkPush.ts
"use server";

import axios from "axios";

interface StkPushPayload {
  mpesa_number: string;
  amount: number;
  accountnumber?: string;
  transactionDesc?: string;
}

export const sendStkPush = async (payload: StkPushPayload) => {
  try {
    const mpesaEnv = process.env.MPESA_ENVIRONMENT;
    const baseUrl = mpesaEnv === "live" 
      ? "https://api.safaricom.co.ke" 
      : "https://sandbox.safaricom.co.ke";

    // 1. Get access token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    
    const tokenResponse = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });

    const token = tokenResponse.data.access_token;

    // 2. Prepare STK push request
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
      
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const stkPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: payload.amount.toFixed(2),
      PartyA: payload.mpesa_number,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: payload.mpesa_number,
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`,
      AccountReference: payload.accountnumber || "Payment",
      TransactionDesc: payload.transactionDesc || "Payment"
    };

    console.log("STK Push payload:", stkPayload);

    // 3. Send STK push
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { data: response.data };
  } catch (error) {
    console.error("STK Push error:", error);
    return { 
      error: error.response?.data || 
      error.message || 
      "Failed to initiate payment" 
    };
  }
};