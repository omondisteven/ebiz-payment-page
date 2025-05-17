// /src/components/PaymentForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendStkPush } from "@/actions/stkPush";
import { stkPushQuery } from "@/actions/stkPushQuery";
import PaymentSuccess from "./Success";
import STKPushQueryLoading from "./StkQueryLoading";
import { HiOutlineCreditCard, HiX, HiCalculator } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";

interface DataFromForm {
  mpesa_number: string;
  name: string;
  amount: number;
  accountnumber?: string;
}

type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

const Calculator = ({ 
  onCalculate, 
  onClose, 
  onClear 
}: { 
  onCalculate: (result: string) => void, 
  onClose: () => void,
  onClear: () => void 
}) => {
  const [input, setInput] = useState('');
  const [liveResult, setLiveResult] = useState('0');

  useEffect(() => {
    try {
      if (input) {
        const sanitizedInput = input.replace(/[+\-*/]+$/, '');
        if (sanitizedInput) {
          // eslint-disable-next-line no-eval
          const result = eval(sanitizedInput);
          setLiveResult(result.toString());
        } else {
          setLiveResult('0');
        }
      } else {
        setLiveResult('0');
      }
    } catch (error) {
      setLiveResult('Error');
    }
  }, [input]);

  const handleButtonClick = (value: string) => {
    if (value === 'OK') {
      if (liveResult !== 'Error') {
        onCalculate(liveResult);
        onClose();
      }
    } else if (value === 'C') {
      setInput('');
      setLiveResult('0');
      onClear();
    } else if (value === '⌫') {
      setInput(input.slice(0, -1));
    } else {
      const lastChar = input.slice(-1);
      if (['+', '-', '*', '/'].includes(value) && ['+', '-', '*', '/'].includes(lastChar)) {
        setInput(input.slice(0, -1) + value);
      } else {
        setInput(input + value);
      }
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '⌫', '+',
    'C', 'OK'
  ];

  return (
    <div className="mt-2 bg-white rounded-lg shadow-md p-2 border border-gray-200 relative">
      <button 
        onClick={onClose}
        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
      >
        <HiX className="h-4 w-4" />
      </button>
      
      <div className="mb-2 p-2 bg-gray-100 rounded">
        <div className="text-gray-600 text-sm h-5 text-right">{input || '0'}</div>
        <div className={`text-lg font-semibold text-right ${
          liveResult === 'Error' ? 'text-red-500' : 'text-gray-800'
        }`}>
          {liveResult}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleButtonClick(btn)}
            className={`p-2 rounded-md text-center font-medium 
              ${btn === 'OK' ? 'bg-green-500 text-white hover:bg-green-600' : 
                btn === 'C' ? 'bg-red-500 text-white hover:bg-red-600' : 
                btn === '⌫' ? 'bg-gray-500 text-white hover:bg-gray-600' : 
                'bg-gray-200 hover:bg-gray-300'}`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactionType, setTransactionType] = useState("");
//   const [data, setData] = useState<any>({});
  const [phoneNumber, setPhoneNumber] = useState("254");
  const [amount, setAmount] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');

  const isCompleteRef = useRef(false);
  const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  interface PaymentData {
  PaybillNumber?: string;
  AccountNumber?: string;
  TillNumber?: string;
  RecepientPhoneNumber?: string;
  AgentId?: string;
  StoreNumber?: string;
  businessName?: string;
  // Add other expected properties
}
const [data, setData] = useState<PaymentData>({});

  // QR code data processing
  useEffect(() => {
    if (searchParams.get('data')) {
      try {
        const rawData = searchParams.get('data') as string;
        let decodedData; 
        
        try {
          decodedData = decodeURIComponent(escape(atob(rawData)));
        } catch (base64Err) {
          console.warn("Base64 decode failed, trying URI decode");
          decodedData = decodeURIComponent(rawData);
        }

        let parsedData = JSON.parse(decodedData);
        if (!parsedData.TransactionType) {
          toast.error("Missing transaction type in QR data");
          return;
        }

        setTransactionType(parsedData.TransactionType);
        setData(parsedData);
        setAmount(parsedData.Amount || "");
        setPhoneNumber(parsedData.PhoneNumber || "254");

      } catch (e) {
        console.error("Error processing QR code data:", e);
        toast.error("Failed to process QR code");
      }
    }
  }, [searchParams]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("254")) {
      value = "254";
      setWarning("Phone number must start with '254'.");
    } else {
      setWarning(null);
    }

    if (value.length > 3) {
      const afterPrefix = value.slice(3);
      if (/^0/.test(afterPrefix)) {
        setError("The digit after '254' cannot be zero.");
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }

    setPhoneNumber(value);
  };

  const handlePhoneNumberBlur = () => {
    if (phoneNumber.length !== 12) {
      setError("Phone number must be exactly 12 digits.");
    } else {
      setError(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handlePayment = async (payload: DataFromForm) => {
    const transactionId = `tx_${Date.now()}`;
    console.log(`[${transactionId}] Initiating payment`);
    
    isCompleteRef.current = false;
    setPaymentStatus('pending');
    setIsPaying(true);
    setIsAwaitingPayment(true);
    setCountdown(60);
    const activeIntervals = new Set<NodeJS.Timeout>();
    activeIntervalsRef.current = activeIntervals;

    const cleanup = () => {
      if (isCompleteRef.current) return;
      isCompleteRef.current = true;
      setIsPaying(false);
      setIsAwaitingPayment(false);
      activeIntervals.forEach(clearInterval);
      activeIntervals.clear();
    };

    try {
      const response = await sendStkPush(payload);

      if (response.error) throw new Error(response.error);

      const result = response.data;
      if (!result.CheckoutRequestID) throw new Error('No CheckoutRequestID received');

      const checkoutId = result.CheckoutRequestID;
      toast.success('Enter your M-PESA PIN when prompted');

      const pollPaymentStatus = async () => {
        try {
          const queryResponse = await stkPushQuery(checkoutId);
          
          if (queryResponse.error) {
            throw queryResponse.error; // If it's already an Error object
            }

          if (queryResponse.data) {
            if (queryResponse.data.ResultCode === "0") {
              setPaymentStatus('success');
              cleanup();
            
              const paymentDetails = {
                ...data,
                TransactionType: transactionType,
                Amount: payload.amount,
                Receipt: queryResponse.data.MpesaReceiptNumber || 'N/A',
                PhoneNumber: payload.mpesa_number,
                AccountNumber: payload.accountnumber || 'N/A',
                Timestamp: new Date().toISOString(),
              };

              toast.success('Payment successful!');
              router.push(`/ThankYouPage?data=${encodeURIComponent(JSON.stringify(paymentDetails))}`);
            } else if (queryResponse.data.ResultCode !== "0") {
              setPaymentStatus('failed');
              cleanup();
              toast.error(queryResponse.data.ResultDesc || 'Payment failed. Please try again.');
            }
          }
        } catch (error) {
          console.error(`[${transactionId}] Poll error:`, error);
        }
      };

      const pollInterval = setInterval(pollPaymentStatus, isMobile ? 5000 : 3000);
      activeIntervals.add(pollInterval);
      pollPaymentStatus();

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (paymentStatus === 'pending') {
              cleanup();
              toast('Payment process timed out', { icon: '⏱️' });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      activeIntervals.add(countdownInterval);

    } catch (error) {
      console.error(`[${transactionId}] Payment error:`, error);
      cleanup();
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handlePayBill = () => {
    if (!phoneNumber.trim() || !data.PaybillNumber?.trim() || !data.AccountNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please fill in all the fields.");
      return;
    }

    handlePayment({
      mpesa_number: phoneNumber.trim(),
      name: "Payment",
      amount: Number(amount),
      accountnumber: data.AccountNumber.trim(),
    });
  };

  const handlePayTill = () => {
    if (!phoneNumber.trim() || !data.TillNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please fill in all the fields.");
      return;
    }

    handlePayment({
      mpesa_number: phoneNumber.trim(),
      name: "Till Payment",
      amount: Number(amount),
      accountnumber: data.TillNumber.trim(),
    });
  };

  const handleSendMoney = () => {
    if (!phoneNumber.trim() || !data.RecepientPhoneNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please fill in all the fields.");
      return;
    }

    handlePayment({
      mpesa_number: phoneNumber.trim(),
      name: "Send Money",
      amount: Number(amount),
      accountnumber: data.RecepientPhoneNumber.trim(),
    });
  };

  const handleWithdraw = () => {
    if (!phoneNumber.trim() || !data.AgentId?.trim() || !data.StoreNumber?.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please fill in all the fields.");
      return;
    }

    handlePayment({
      mpesa_number: phoneNumber.trim(),
      name: "Withdraw",
      amount: Number(amount),
      accountnumber: data.StoreNumber.trim(),
    });
  };

  if (paymentStatus === 'success') {
    return <PaymentSuccess />;
  }

  if (isAwaitingPayment) {
    return <STKPushQueryLoading number={phoneNumber} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 items-center">
      {/* Container with full width */}
      <div className="w-full max-w-4xl flex flex-col flex-grow px-4"> {/* Changed width and added padding */}
        {/* Header Section - now full width */}
        <div className="p-4 border-b border-gray-200 bg-white shadow-sm rounded-t-lg">
          <h2 className="text-xl font-bold text-center" style={{color: "#3CB371"}}>
            M-POSTER: M-PESA PAYMENT PROMPT
          </h2>
        </div>
        
        {/* Main Content - now full width */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)] p-6 my-4 border border-gray-200"> {/* Increased padding */}
            <div className="text-center">
              <p className="text-lg mb-4 text-center">
                You are about to perform a <strong>{transactionType}</strong> transaction to <br /> 
                {data.businessName ? <strong style={{color: "#3CB371"}}>{data.businessName}</strong> : <strong style={{color: "#3CB371"}}>BLTA SOLUTIONS LTD</strong>}.
              </p>
            </div>            
            <hr />
            <br />

            <div className="space-y-4">
              {transactionType === "PayBill" && (
                <>
                  <p>Paybill Number: {data.PaybillNumber}</p>
                  <p>Account Number: {data.AccountNumber}</p>
                  <label className="block text-sm font-bold">Amount:</label>
                  <div className="relative">
                    <Input
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter Amount (KES)"
                      type="number"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                    />
                    <button 
                      onClick={() => setShowCalculator(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      <HiCalculator className="h-5 w-5" />
                    </button>
                  </div>
                  {showCalculator && (
                    <Calculator 
                      onCalculate={(result) => setAmount(result)} 
                      onClose={() => setShowCalculator(false)}
                      onClear={() => setAmount('')}
                    />
                  )}
                </>
              )}

              {transactionType === "BuyGoods" && (
                <>
                  <p>Till Number: {data.TillNumber}</p>
                  <label className="block text-sm font-bold">Amount:</label>
                  <div className="relative">
                    <Input
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter Amount (KES)"
                      type="number"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                    />
                    <button 
                      onClick={() => setShowCalculator(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      <HiCalculator className="h-5 w-5" />
                    </button>
                  </div>
                  {showCalculator && (
                    <Calculator 
                      onCalculate={(result) => setAmount(result)} 
                      onClose={() => setShowCalculator(false)}
                      onClear={() => setAmount('')}
                    />
                  )}
                </>
              )}

              {transactionType === "SendMoney" && (
                <>
                  <p>Recipient Phone Number: {data.RecepientPhoneNumber}</p>
                  <label className="block text-sm font-bold">Amount:</label>
                  <div className="relative">
                    <Input
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter Amount (KES)"
                      type="number"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                    />
                    <button 
                      onClick={() => setShowCalculator(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      <HiCalculator className="h-5 w-5" />
                    </button>
                  </div>
                  {showCalculator && (
                    <Calculator 
                      onCalculate={(result) => setAmount(result)} 
                      onClose={() => setShowCalculator(false)}
                      onClear={() => setAmount('')}
                    />
                  )}
                </>
              )}

              {transactionType === "WithdrawMoney" && (
                <>
                  <p>Agent ID: {data.AgentId}</p>
                  <p>Store Number: {data.StoreNumber}</p>
                  <label className="block text-sm font-bold">Amount:</label>
                  <div className="relative">
                    <Input
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter Amount (KES)"
                      type="number"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm pr-10 w-full"
                    />
                    <button 
                      onClick={() => setShowCalculator(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      <HiCalculator className="h-5 w-5" />
                    </button>
                  </div>
                  {showCalculator && (
                    <Calculator 
                      onCalculate={(result) => setAmount(result)} 
                      onClose={() => setShowCalculator(false)}
                      onClear={() => setAmount('')}
                    />
                  )}
                </>
              )}
            </div>

            <div className="mt-6"> {/* Increased margin */}
              <label className="block text-sm font-bold">Payers Phone Number:</label>
              <Input
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                onBlur={handlePhoneNumberBlur}
                placeholder="Enter Phone Number"
                type="tel"
                inputMode="tel"
                pattern="[0-9\- ]*"
                className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md shadow-sm"
                onKeyDown={(e) => {
                  const allowedKeys = [
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                    '-', ' ', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'
                  ];
                  if (!allowedKeys.includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {warning && <p className="text-yellow-600 text-sm mt-1">{warning}</p>}
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white shadow-sm rounded-b-lg mx-2 sm:mx-0 mb-2 sm:mb-0">
          <div className="flex flex-col space-y-4"> {/* Increased spacing */}
            {(transactionType === "PayBill" || 
              transactionType === "BuyGoods" || 
              transactionType === "SendMoney" || 
              transactionType === "WithdrawMoney") && (
              <Button
                className="font-bold w-full bg-green-900 text-white py-3 rounded-md shadow-md"
                style={{ backgroundColor: "#006400" }}
                onClick={() => {
                  switch(transactionType) {
                    case "PayBill":
                      return handlePayBill();
                    case "BuyGoods":
                      return handlePayTill();
                    case "SendMoney":
                      return handleSendMoney();
                    case "WithdrawMoney":
                      return handleWithdraw();
                    default:
                      return;
                  }
                }}
                disabled={isPaying || !!error || !!warning || phoneNumber.length !== 12 || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                <HiOutlineCreditCard className="mr-2" />
                {transactionType === "SendMoney" ? "SEND" : 
                transactionType === "WithdrawMoney" ? "WITHDRAW" : "PAY"}
              </Button>
            )}
            {isAwaitingPayment && (
              <div className="text-yellow-600 text-sm mt-2 text-center">
                Awaiting MPESA PIN entry... {countdown}s remaining
              </div>
            )}

            <Button
              className="font-bold w-full bg-gray-700 bg-gray-800 text-white py-3 rounded-md shadow-md"
              onClick={() => router.push("/ThankYouPage")}
            >
              <HiX className="mr-2" />
              Cancel
            </Button>
          </div>
          {paymentStatus === 'cancelled' && (
            <div className="text-red-500">
                Payment cancelled by the user
            </div>
          )}
          {(paymentStatus as PaymentStatus) === 'success' && (
            <div className="text-green-500">
                Payment successful! Redirecting...
            </div>
            )}
        </div>
        
        <div className="py-4 text-center text-sm text-gray-500">
          Powered by{' '}
          <Link 
            href="https://www.bltasolutions.co.ke" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 hover:underline"
          >
            BLTA Solutions
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;