"use server";

import axios, { AxiosError } from "axios";

interface StkPushPayload {
  mpesa_number: string;
  amount: number;
  accountnumber?: string;
  transactionDesc?: string;
  transactionType?: string;
}

interface MpesaErrorResponse {
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
}

export const sendStkPush = async (payload: StkPushPayload) => {
  try {
    // Determine environment
    const mpesaEnv = process.env.MPESA_ENVIRONMENT?.toLowerCase();
    const baseUrl =
      mpesaEnv === "live"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    // Generate access token
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const tokenResponse = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const token = tokenResponse.data.access_token;

    // Format timestamp
    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE?.trim()}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    // Format phone number (ensure it starts with 254)
    const formattedPhone = payload.mpesa_number.replace(/\D/g, "").replace(/^0/, "254");

    // Build STK payload
    const stkPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE?.trim(),
      Password: password,
      Timestamp: timestamp,
      TransactionType: payload.transactionType || "CustomerPayBillOnline", // OR "CustomerBuyGoodsOnline"
      Amount: Number(payload.amount), // Must be number
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE?.trim(),
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: payload.accountnumber || "Payment",
      TransactionDesc: payload.transactionDesc || "Payment",
    };

    console.log("Sending STK Push payload:", stkPayload);

    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("STK Push API response:", response.data);

    return { data: response.data };
  } catch (err) {
    const error = err as AxiosError<MpesaErrorResponse>;
    console.error("STK Push error:", error.response?.data || error.message);

    return {
      error:
        error.response?.data?.errorMessage ||
        error.message ||
        "Failed to initiate STK Push",
    };
  }
};
