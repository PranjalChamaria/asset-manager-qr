import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/lib/asset-types";
import { Printer } from "lucide-react";

function Label({ asset, url }: { asset: Asset; url: string }) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      // 22mm @ 203dpi ≈ 176px, quiet zone 4 modules, EC level M
      QRCode.toCanvas(qrRef.current, url, {
        width: 176,
        margin: 4,
        errorCorrectionLevel: "M",
      });
    }
    if (barRef.current) {
      JsBarcode(barRef.current, asset.asset_code, {
        format: "CODE128",
        displayValue: true,
        fontSize: 10,
        height: 32, // ~9mm visual; container clips to 9mm
        margin: 0,
        width: 1.4,
      });
    }
  }, [url, asset.asset_code]);

  return (
    <div
      className="label-card bg-white text-black flex flex-col overflow-hidden"
      style={{
        width: "50.8mm",
        height: "38.1mm",
        padding: "2mm",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        border: "1px dashed #999",
      }}
    >
      {/* Company name: 4mm */}
      <div
        style={{ height: "4mm", lineHeight: "4mm", fontSize: "2.8mm", fontWeight: 700 }}
        className="truncate text-center"
      >
        {asset.company || "Asset"}
      </div>
      <div style={{ height: "1px", background: "#000" }} />
      {/* QR + text: 22mm */}
      <div style={{ height: "22mm" }} className="flex items-center gap-[1.5mm]">
        <canvas
          ref={qrRef}
          className="shrink-0"
          style={{ width: "22mm", height: "22mm" }}
        />
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: "2.6mm", fontWeight: 700, lineHeight: 1.15 }} className="truncate">
            {asset.asset_name}
          </div>
          <div style={{ fontSize: "2mm", lineHeight: 1.2 }} className="truncate font-mono">
            {asset.asset_code}
          </div>
          {asset.location && (
            <div style={{ fontSize: "1.8mm", lineHeight: 1.2 }} className="truncate">
              {asset.location}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: "1px", background: "#000" }} />
      {/* Barcode: 9mm */}
      <div style={{ height: "9mm" }} className="flex items-center justify-center overflow-hidden">
        <svg
          ref={barRef}
          style={{ width: "44mm", height: "9mm", display: "block" }}
          preserveAspectRatio="none"
        />
      </div>
      {/* Bottom text: 3mm */}
      <div
        style={{ height: "3mm", lineHeight: "3mm", fontSize: "1.8mm", letterSpacing: "0.05em" }}
        className="text-center font-bold"
      >
        SCAN FOR DETAILS
      </div>
    </div>
  );
}

export function LabelSheet({ asset }: { asset: Asset }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/asset/${asset.asset_code}`
    : `/asset/${asset.asset_code}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()} size="sm">
          <Printer className="size-4 mr-1.5" /> Print labels
        </Button>
      </div>
      <div className="print-area flex flex-wrap gap-4 justify-center p-4 bg-muted/30 rounded-lg">
        <Label asset={asset} url={url} />
        <Label asset={asset} url={url} />
      </div>
      <style>{`
        @page { margin: 5mm; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; background: white !important; padding: 0 !important; gap: 4mm !important; }
          .label-card { border: none !important; }
        }
      `}</style>
    </div>
  );
}