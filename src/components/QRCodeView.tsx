import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export default function QRCodeView({
  value,
  size = 180,
  className = "",
  darkColor = "#0F472A", // Brand forest green or #000000
  lightColor = "#FFFFFF",
}: QRCodeViewProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) return;

    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x density for sharp retina/print display
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code", err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 animate-pulse rounded-lg flex items-center justify-center ${className}`}
      >
        <span className="text-[10px] text-slate-400">Generating QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code for ${value}`}
      width={size}
      height={size}
      className={`object-contain block ${className}`}
    />
  );
}
