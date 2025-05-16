import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import {
  Mail, Phone, Globe, MapPin, Share2, Download, Copy, X, Contact, FileDown, Share
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
// import { title } from "process";
import { MousePointerClick } from "lucide-react";


const ThankYouPage = () => {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>({});
  const [receiptNumber, setReceiptNumber] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
  if (router.query.data) {
    try {
      let rawData = router.query.data as string;
      console.log("✅ Raw data received from QR:", rawData);

      let decodedData;
      let parsedData;

      // Attempt 1: Direct Base64 decode (new format)
      try {
        decodedData = decodeURIComponent(escape(atob(rawData)));
        parsedData = JSON.parse(decodedData);
        console.log("✅ Successfully decoded with Base64 method");
      } catch (base64Err) {
        console.warn("⚠️ Base64 decode failed, trying alternative methods:", base64Err);

        // Attempt 2: Double URI decode (legacy format)
        try {
          decodedData = decodeURIComponent(decodeURIComponent(rawData));
          parsedData = JSON.parse(decodedData);
          console.log("✅ Successfully decoded with double URI method");
        } catch (doubleDecodeErr) {
          console.warn("⚠️ Double decode failed, trying single decode:", doubleDecodeErr);

          // Attempt 3: Single URI decode
          try {
            decodedData = decodeURIComponent(rawData);
            parsedData = JSON.parse(decodedData);
            console.log("✅ Successfully decoded with single URI method");
          } catch (singleDecodeErr) {
            console.warn("⚠️ Single decode failed, trying raw JSON parse:", singleDecodeErr);

            // Attempt 4: Direct JSON parse (might work for some legacy codes)
            try {
              parsedData = JSON.parse(rawData);
              console.log("✅ Successfully parsed raw JSON");
            } catch (finalErr) {
              console.error("❌ All decode attempts failed:", finalErr);
              toast.error("Invalid QR code format. Please try scanning again.");
              return;
            }
          }
        }
      }

      // Validate the parsed data
      if (!parsedData || typeof parsedData !== 'object') {
        console.error("❌ Parsed data is not an object:", parsedData);
        toast.error("Invalid QR data structure");
        return;
      }

      if (!parsedData.TransactionType && !parsedData.businessName) {
        console.error("❌ Required fields missing from parsed data:", parsedData);
        toast.error("QR code missing required data fields");
        return;
      }

      console.log("✅ Final parsed data object:", parsedData);

      // Set the data
      setReceiptData(parsedData);
      
      // Generate receipt number
      // const generatedReceiptNumber = "RCPT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      // setReceiptNumber(generatedReceiptNumber);
      // console.log("📄 Generated Receipt Number:", generatedReceiptNumber);

      // // Set timestamp
      // const now = new Date();
      // const formattedTimestamp = now.toLocaleString("en-KE", {
      //   year: "numeric",
      //   month: "short",
      //   day: "2-digit",
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   second: "2-digit",
      // });
      // setTimestamp(formattedTimestamp);

      setReceiptNumber(parsedData.Receipt || 'N/A');

      if (parsedData.Timestamp) {
        const parsedDate = new Date(parsedData.Timestamp);
        const formattedTimestamp = parsedDate.toLocaleString("en-KE", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setTimestamp(formattedTimestamp);
      } else {
        setTimestamp('N/A');
      }

      // console.log("🕒 Timestamp:", formattedTimestamp);

    } catch (e) {
      console.error("❌ Error processing QR code data:", e);
      toast.error("Failed to process QR code. Please try again.");
    }
  }
}, [router.query]);



  const handleDownload = async () => {
    const input = showContact ? contactRef.current : receiptRef.current;
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${showContact ? 'contact' : receiptNumber}.pdf`);
  };

  const handleShare = async () => {
    const input = showContact ? contactRef.current : receiptRef.current;
    if (navigator.share && input) {
      const canvas = await html2canvas(input);
      canvas.toBlob(async (blob) => {
        const file = new File([blob!], `${showContact ? 'contact' : receiptNumber}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: showContact ? "Contact information!" : "Your Receipt",
          text: showContact ? "Here is the contact information." : "Here is your transaction receipt.",
        });
      });
    } else {
      alert("Sharing not supported. Please download instead.");
    }
  };

  const downloadContactQR = () => {
    if (contactRef.current) {
      toPng(contactRef.current).then(dataUrl => {
        saveAs(dataUrl, `contact.png`);
      });
    }
  };

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
      .then(() => alert("Link copied to clipboard!"))
      .catch(() => alert("Failed to copy link"));
  };

  const shareContact = async () => {
    if ('share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${receiptData.businessName}'s Contact Card`,
          text: `Here's ${receiptData.businessName}'s contact information`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      copyLink();
    }
  };

  const handleWhatsAppClick = (phoneNumber: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${phoneNumber}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {!showContact ? (
        <div
        ref={receiptRef}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center overflow-auto border border-gray-400 border-dotted"
       >
        <div className="flex flex-col items-center mb-6">
          {/* Animated Tick Icon */}
          <div className="animate-ping-once bg-green-500 rounded-full p-3 mb-2">
            <svg
              className="w-10 h-10 text-white animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Swiping Success Text */}
          <div className="overflow-hidden">
            <p className="text-green-600 animate-slide-in">
              Success!
            </p>
          </div>
        </div>

        {/* Increased size for businessName */}
        <h2 className="text-2xl font-bold mt-2 mb-1"
        style={{color: "#2ecc71"}}>
          {receiptData.businessName || "BLTA Solutions Limited"}
        </h2>
        <p className="font-bold mt-2 mb-1"
        style={{color: "#999999"}}>
          {receiptData.businessComment || "SMS | Short Codes | Solutions"}
        </p>       
        
        {/* Reduced size for "YOUR RECEIPT" heading */}
        {/* <h3 className="text-xl font-bold mb-4">YOUR RECEIPT</h3> */}
        <p className="text-3xl text-green-700 font-bold my-4">
          {new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(receiptData.Amount)}
        </p>
        <QRCode
          value={JSON.stringify({
            receiptNumber,
            businessName: receiptData.businessName,
            amount: receiptData.Amount,
            description: receiptData.businessComment,
            email: receiptData.businessEmail,
            timestamp,
          })}
          size={128}
          className="mx-auto my-4"
        />
        {/* Center-aligned Download and Share icons */}
        <div className="flex justify-center gap-4 mb-4">
          <Download 
            onClick={handleDownload}
            className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-700 hover:scale-110 transition-all"
            name="Download Receipt"
          />
          <Share2 
            onClick={handleShare}
            className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700 hover:scale-110 transition-all"
            name="Share Receipt"
          />
        </div>
        <div className="mt-2 text-sm break-words space-y-1">
          {receiptData.businessAddress && <p>{receiptData.businessAddress}</p>}
          {receiptData.businessPhone && <p className="font-bold text-green-600">{receiptData.businessPhone}</p>}
          <p>{receiptData.businessComment}</p>
        </div>

        <br />
        <p>{receiptData.TransactionType}</p>  
        <br />
        <p className="text-sm text-gray-500 mb-1">MPESA REF#: {receiptNumber}</p>
        <p className="text-sm text-gray-500 mb-4">Date: {timestamp}</p>
        {/* <hr className="my-4 border-gray-300" /> */}
        <br />
        <div className="w-full bg-gray-900 text-yellow-300 font-semibold italic p-4 rounded-3xl shadow-lg animate-blink">
          {receiptData.businessPromo1 || "Look out for Our Special Offers Here!"}
        </div>
       
      </div>
      ) : (
        <div
          ref={contactRef}
          className="bg-white p-6 rounded-lg border-4 border-[#2f363d] shadow-md w-full max-w-md relative overflow-y-auto max-h-[90vh]"
         >

          {/* Close button at top right */}
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setShowContact(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold mb-4 text-center">Contact us directly</h2>

          <div className="flex justify-center mb-4 w-full p-4 bg-white">
            <QRCode 
              value={JSON.stringify({
                name: receiptData.businessName,
                email: receiptData.businessEmail,
                phone: receiptData.businessPhone,
                address: receiptData.businessAddress,
                description: receiptData.businessComment,
              })} 
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              bgColor="transparent"
            />
          </div>

          <div className="space-y-3">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold" style={{color: "#3CB371"}}>
                {receiptData.businessName}
              </h1>
            </div>

            {/* Phone */}
            {receiptData.businessPhone && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <Phone className="w-5 h-5 mr-3 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{receiptData.businessPhone}</p>
                </div>
                <a href={`tel:${receiptData.businessPhone}`} className="p-1 hover:bg-gray-100 rounded">
                  <Phone className="w-5 h-5 text-blue-500" />
                </a>
              </div>
            )}

            {/* Email */}
            {receiptData.businessEmail && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <Mail className="w-5 h-5 mr-3 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{receiptData.businessEmail}</p>
                </div>
                <a href={`mailto:${receiptData.businessEmail}`} className="p-1 hover:bg-gray-100 rounded">
                  <Mail className="w-5 h-5 text-blue-500" />
                </a>
              </div>
            )}

            {/* Address */}
            {receiptData.businessAddress && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{receiptData.businessAddress}</p>
                </div>
                <a 
                  href={`https://maps.google.com?q=${encodeURIComponent(receiptData.businessAddress)}`} 
                  target="_blank" 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MapPin className="w-5 h-5 text-blue-500" />
                </a>
              </div>
            )}

            {/* WhatsApp */}
            {receiptData.businessPhone && (
              <div className="flex items-center p-2 border rounded hover:bg-gray-50">
                <FaWhatsapp className="w-5 h-5 mr-3 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p>{receiptData.businessPhone}</p>
                </div>
                <a 
                  href="#" 
                  onClick={(e) => handleWhatsAppClick(receiptData.businessPhone, e)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FaWhatsapp className="w-5 h-5 text-green-500" />
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={downloadContactQR}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button 
              onClick={shareContact}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      )}

      {!showContact && (
        <div className="w-full max-w-md mt-6">
        <Button
          onClick={() => setShowContact(true)}
          className="w-full bg-green-900 text-white hover:bg-purple-700 px-6 py-4 rounded-lg flex items-center justify-center gap-3 text-lg font-bold"
        >          
          <p>{receiptData.businessPromo2 || "Contact us for available Offers!"}</p>
          <MousePointerClick  className="mr-2" />
        </Button>
      </div>
      
      )}

    </div>
  );
};

export default ThankYouPage;