import type { Metadata } from "next"
import ReceiptPrinter from "./receipt-printer"

export const metadata: Metadata = {
  title: "Receipt Printer — Effects Shelf",
}

export default function ReceiptPrinterPage() {
  return <ReceiptPrinter />
}
