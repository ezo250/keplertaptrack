import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QrCode, Download, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { QRCode as QRCodeType, QRCodeType as QRType } from '@/types';

interface QRCodeManagementProps {
  onGenerateQRCode?: (type: QRType, validUntil?: string) => Promise<void>;
}

export default function QRCodeManagement({ onGenerateQRCode }: QRCodeManagementProps) {
  const [qrCodeType, setQrCodeType] = useState<QRType>('pickup');
  const [validUntil, setValidUntil] = useState<string>('');
  const [generatedQRCodes, setGeneratedQRCodes] = useState<{
    pickup?: QRCodeType;
    return?: QRCodeType;
  }>({});
  const qrRefPickup = useRef<HTMLDivElement>(null);
  const qrRefReturn = useRef<HTMLDivElement>(null);

  // Generate a mock QR code value (in real app, this would come from backend)
  const generateQRCodeValue = (type: QRType) => {
    const timestamp = new Date().getTime();
    return `KEPLER_${type.toUpperCase()}_AUTH_${timestamp}`;
  };

  const handleGenerateQRCode = async () => {
    try {
      // Generate QR code locally (in real app, call backend API)
      const qrCodeValue = generateQRCodeValue(qrCodeType);
      const newQRCode: QRCodeType = {
        id: Math.random().toString(36).substr(2, 9),
        type: qrCodeType,
        code: qrCodeValue,
        validFrom: new Date(),
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive: true,
        createdAt: new Date(),
      };

      setGeneratedQRCodes(prev => ({
        ...prev,
        [qrCodeType]: newQRCode,
      }));

      // Call the callback if provided
      if (onGenerateQRCode) {
        await onGenerateQRCode(qrCodeType, validUntil);
      }

      toast.success(`${qrCodeType === 'pickup' ? 'Pickup' : 'Return'} QR code generated successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate QR code');
    }
  };

  const handleDownloadQRCode = (type: QRType) => {
    const qrRef = type === 'pickup' ? qrRefPickup : qrRefReturn;
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kepler-${type}-qr-code-${new Date().getTime()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('QR code downloaded successfully');
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleUpdateQRCode = async (type: QRType) => {
    try {
      const qrCodeValue = generateQRCodeValue(type);
      const updatedQRCode: QRCodeType = {
        id: generatedQRCodes[type]?.id || Math.random().toString(36).substr(2, 9),
        type: type,
        code: qrCodeValue,
        validFrom: new Date(),
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive: true,
        createdAt: generatedQRCodes[type]?.createdAt || new Date(),
        lastUpdatedAt: new Date(),
      };

      setGeneratedQRCodes(prev => ({
        ...prev,
        [type]: updatedQRCode,
      }));

      if (onGenerateQRCode) {
        await onGenerateQRCode(type, validUntil);
      }

      toast.success(`${type === 'pickup' ? 'Pickup' : 'Return'} QR code updated successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update QR code');
    }
  };

  const getValidityText = (qrCode?: QRCodeType) => {
    if (!qrCode) return '';
    if (!qrCode.validUntil) return 'Valid indefinitely';
    
    const validUntilDate = new Date(qrCode.validUntil);
    const now = new Date();
    const isExpired = validUntilDate < now;
    
    return isExpired 
      ? `Expired on ${validUntilDate.toLocaleDateString()}`
      : `Valid until ${validUntilDate.toLocaleDateString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>QR Code Management</CardTitle>
              <CardDescription>
                Generate and manage QR codes for device pickup and return authorization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Form */}
          <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Generate New QR Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-type">QR Code Type</Label>
                <Select value={qrCodeType} onValueChange={(value: QRType) => setQrCodeType(value)}>
                  <SelectTrigger id="qr-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Device Pickup</SelectItem>
                    <SelectItem value="return">Device Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid Until (Optional)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="valid-until"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for indefinite validity
                </p>
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerateQRCode} className="w-full gap-2">
                  <QrCode className="w-4 h-4" />
                  Generate QR Code
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pickup QR Code */}
            <div className="p-6 border border-border/50 rounded-lg bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Pickup QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Teachers scan this to authorize device pickup
                  </p>
                </div>
                {generatedQRCodes.pickup && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </div>
                )}
              </div>

              {generatedQRCodes.pickup ? (
                <>
                  <div ref={qrRefPickup} className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={generatedQRCodes.pickup.code}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      {getValidityText(generatedQRCodes.pickup)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQRCode('pickup')}
                        className="flex-1 gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQRCode('pickup')}
                        className="flex-1 gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Update
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No pickup QR code generated yet
                  </p>
                </div>
              )}
            </div>

            {/* Return QR Code */}
            <div className="p-6 border border-border/50 rounded-lg bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Return QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Teachers scan this to confirm device return
                  </p>
                </div>
                {generatedQRCodes.return && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </div>
                )}
              </div>

              {generatedQRCodes.return ? (
                <>
                  <div ref={qrRefReturn} className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={generatedQRCodes.return.code}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      {getValidityText(generatedQRCodes.return)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQRCode('return')}
                        className="flex-1 gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQRCode('return')}
                        className="flex-1 gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Update
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No return QR code generated yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> Teachers need to scan the appropriate QR code to authorize device pickup or return.
              This ensures proper tracking and prevents unauthorized device claims. You can update QR codes weekly or keep them active indefinitely.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
