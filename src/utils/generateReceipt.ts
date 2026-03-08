import { PROPERTIES } from "@/data/properties";

export interface ReceiptData {
  contractId: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: string;
  completedAt: string;
  buyerName?: string;
  sellerName?: string;
}

function getPaymentMethod(currency: string): string {
  if (currency === "BANK_TRANSFER") return "Paystack (Bank Transfer / NGN)";
  return currency;
}

function buildReceiptHTML(data: ReceiptData): string {
  const property = PROPERTIES.find((p) => p.id === Number(data.propertyId));
  const propertyTitle = property?.title || "Property";
  const propertyLocation = property?.location || "";
  const paymentMethod = getPaymentMethod(data.currency);
  const date = new Date(data.completedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const time = new Date(data.completedAt).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Rialo Receipt - ${data.contractId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; max-width: 700px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 24px; margin-bottom: 32px; }
  .logo { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #10b981; }
  .logo span { color: #1a1a1a; }
  .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #1a1a1a; }
  .section { margin-bottom: 28px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 13px; color: #6b7280; }
  .value { font-size: 13px; font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }
  .amount-row .value { font-size: 18px; color: #10b981; }
  .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 2px solid #f3f4f6; }
  .footer p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
  .verify { display: inline-block; margin-top: 12px; background: #f3f4f6; padding: 8px 16px; border-radius: 8px; font-size: 11px; color: #6b7280; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">Rialo<span>Settle</span></div>
    <div class="subtitle">Blockchain-Powered Real Estate Settlement</div>
    <div class="badge">✓ TRANSACTION COMPLETED</div>
  </div>

  <div class="section">
    <h2>Proof of Payment</h2>
    <div class="row">
      <span class="label">Contract ID</span>
      <span class="value">${data.contractId}</span>
    </div>
    <div class="row">
      <span class="label">Date of Completion</span>
      <span class="value">${date} · ${time}</span>
    </div>
    <div class="row">
      <span class="label">Status</span>
      <span class="value" style="color:#10b981;">Completed</span>
    </div>
  </div>

  <div class="section">
    <h2>Transaction Summary</h2>
    <div class="row">
      <span class="label">Property</span>
      <span class="value">${propertyTitle}</span>
    </div>
    <div class="row">
      <span class="label">Location</span>
      <span class="value">${propertyLocation}</span>
    </div>
    <div class="row">
      <span class="label">Buyer</span>
      <span class="value">${data.buyerName || data.buyerId.slice(0, 8) + "..."}</span>
    </div>
    <div class="row">
      <span class="label">Seller</span>
      <span class="value">${data.sellerName || data.sellerId.slice(0, 8) + "..."}</span>
    </div>
    <div class="row amount-row">
      <span class="label">Amount Paid</span>
      <span class="value">₦${Number(data.amount).toLocaleString()}</span>
    </div>
    <div class="row">
      <span class="label">Payment Method</span>
      <span class="value">${paymentMethod}</span>
    </div>
  </div>

  <div class="section">
    <h2>Verification</h2>
    <div class="row">
      <span class="label">Contract Reference</span>
      <span class="value" style="font-family:monospace;">${data.contractId}</span>
    </div>
    <div class="row">
      <span class="label">Blockchain Status</span>
      <span class="value" style="color:#10b981;">Verified on Rialo Smart Contract</span>
    </div>
  </div>

  <div class="footer">
    <p>This document serves as official proof of payment for the above property transaction.<br/>
    Verified and secured by the Rialo Reactive Smart Contract Engine.</p>
    <div class="verify">Verify at rialo-settle-prime.lovable.app/transaction/${data.contractId}</div>
    <p style="margin-top:16px;">© ${new Date().getFullYear()} RialoSettle · All rights reserved</p>
  </div>
</body>
</html>`;
}

export function downloadReceipt(data: ReceiptData) {
  const html = buildReceiptHTML(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  
  // Open in new window for print/save as PDF
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  } else {
    // Fallback: download as HTML
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rialo-Receipt-${data.contractId}.html`;
    a.click();
  }
  
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
