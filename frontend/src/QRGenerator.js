import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

const QRGenerator = ({ type, data, customization, selectedSticker, stickerSize }) => {
  const canvasRef = useRef(null);
  const [qrData, setQrData] = useState('');

  const generateQRData = (type, data) => {
    switch (type) {
      case 'url':
        return data;
      case 'text':
        return data;
      case 'email':
        return `mailto:${data}`;
      case 'sms':
        return `sms:${data}`;
      case 'whatsapp':
        return `https://wa.me/${data}`;
      case 'wifi':
        const [ssid, password, typeWifi] = data.split(';');
        return `WIFI:S:${ssid};P:${password};T:${typeWifi};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\n${data}\nEND:VCARD`;
      case 'event':
        return `BEGIN:VEVENT\n${data}\nEND:VEVENT`;
      default:
        return data;
    }
  };

  useEffect(() => {
    if (type && data) {
      setQrData(generateQRData(type, data));
    }
  }, [type, data]);

  useEffect(() => {
    if (qrData && canvasRef.current) {
      const errorCorrectionLevel = selectedSticker ? 'H' : 'M';
      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: 256,
          margin: 2,
          color: {
            dark: customization?.fgColor || '#000000',
            light: customization?.transparentBg ? '#ffffff00' : (customization?.bgColor || '#ffffff'),
          },
          errorCorrectionLevel: errorCorrectionLevel,
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [qrData, customization, selectedSticker]);

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Generated QR Code</h3>
      {qrData ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas ref={canvasRef} />
          {selectedSticker && (
            <img
              src={selectedSticker.url}
              alt={selectedSticker.name}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${stickerSize * 2.56}px`,
                height: `${stickerSize * 2.56}px`,
                backgroundColor: 'white',
                borderRadius: '50%',
                padding: '5px',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      ) : (
        <p>Enter data to generate QR code</p>
      )}
      {selectedSticker && <p>Selected Sticker: {selectedSticker.name} (Size: {stickerSize}%)</p>}
    </div>
  );
};

export default QRGenerator;