import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Custom hook for rendering QR code to canvas
 * @param {Object} params - Rendering parameters
 * @param {string} params.qrContent - The content to encode in QR code
 * @param {string} params.qrColor - Color of QR code modules
 * @param {string} params.bgColor - Background color
 * @param {number} params.qrSize - Size of QR code in pixels
 * @param {string} params.errorCorrectionLevel - Error correction level (L, M, Q, H)
 * @param {boolean} params.includeMargin - Whether to include margin
 * @param {string|null} params.selectedSticker - Selected sticker data URL or emoji
 * @param {string|null} params.selectedLogo - Selected logo data URL
 * @param {string} params.selectedFrame - Selected frame type ('none', 'frame1', 'frame2', 'frame3')
 * @param {string} params.frameColor - Color of the frame
 * @param {string} params.framePhrase - Text to display on frame
 * @param {string} params.frameFont - Font for frame text
 * @param {React.RefObject} canvasRef - Reference to canvas element
 */
export const useQRRenderer = ({
  qrContent,
  qrColor,
  bgColor,
  qrSize,
  errorCorrectionLevel,
  includeMargin,
  selectedSticker,
  selectedLogo,
  selectedFrame,
  frameColor,
  framePhrase,
  frameFont
}, canvasRef) => {
  useEffect(() => {
    const renderPreview = async () => {
      if (!canvasRef.current || !qrContent) return;

      const canvas = canvasRef.current;
      const canvasWidth = qrSize;
      const isFrame2Preview = selectedFrame === 'frame2';
      const isFrame3Preview = selectedFrame === 'frame3';
      const isFrame23Preview = isFrame2Preview || isFrame3Preview;
      const canvasHeight = qrSize;
      
      // Frame #2 specific measurements - keep canvas same size, draw frame within it
      const frame2OuterWidth = 200; // Original width
      const frame2PaddingTop = 14;
      const frame2PaddingRight = 14;
      const frame2PaddingBottom = 10;
      const frame2PaddingLeft = 14;
      const frame2QrAreaSize = 172; // Original QR size within frame
      const frame2BorderRadius = 14;
      const frame2QrAreaBorderRadius = 4;
      const frame2LabelGap = 8;
      const frame2TotalHeight = 236;
      
      // Calculate positions for frame #2
      const frame2X = (canvasWidth - frame2OuterWidth) / 2;
      const frame2Y = (canvasHeight - frame2TotalHeight) / 2;
      const frame2QrX = frame2X + frame2PaddingLeft;
      const frame2QrY = frame2Y + frame2PaddingTop;
      
      let qrRenderSize = qrSize - 60;
      let qrOffsetX = 30;
      let qrOffsetY = selectedFrame === 'frame2' ? 20 : 30;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (isFrame23Preview) {
        if (isFrame2Preview) {
          // Draw frame #2 with exact measurements
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(frame2X, frame2Y, frame2OuterWidth, frame2TotalHeight, frame2BorderRadius);
          ctx.fill();
          
          // Draw white QR area
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(frame2QrX, frame2QrY, frame2QrAreaSize, frame2QrAreaSize, frame2QrAreaBorderRadius);
          ctx.fill();
          
          // Update QR position for frame #2
          qrOffsetX = frame2QrX;
          qrOffsetY = frame2QrY;
          qrRenderSize = frame2QrAreaSize;
        } else {
          // Original frame 3 logic
          const frameX = 10;
          const frameY = 10;
          const frameWidth = canvasWidth - 20;
          const frameHeight = canvasHeight - 20;
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(frameX, frameY, frameWidth, frameHeight, 24);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrOffsetX, qrOffsetY, qrRenderSize, qrRenderSize, 16);
          ctx.fill();
        }
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = qrRenderSize;
      tempCanvas.height = qrRenderSize;

      await new Promise((resolve, reject) => {
        QRCode.toCanvas(
          tempCanvas,
          qrContent,
          {
            width: qrRenderSize,
            margin: includeMargin ? 2 : 0,
            color: {
              dark: qrColor,
              light: bgColor,
            },
            errorCorrectionLevel: errorCorrectionLevel,
          },
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });

      ctx.drawImage(tempCanvas, qrOffsetX, qrOffsetY);

      // Apply frame effects
      if (selectedFrame === 'frame1') {
        const frameBorderWidth = 10;
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = frameBorderWidth;
        ctx.strokeRect(qrOffsetX + frameBorderWidth / 2, qrOffsetY + frameBorderWidth / 2, qrRenderSize - frameBorderWidth, qrRenderSize - frameBorderWidth);
      }

      // Apply sticker if selected (centered on the QR area)
      if (selectedSticker) {
        const stickerSize = qrSize * 0.2; // 20% of QR dimension
        const padding = 6;
        const totalBackgroundSize = stickerSize + 2 * padding; // Include padding in centering calculation
        const x = qrOffsetX + (qrRenderSize - totalBackgroundSize) / 2;
        const y = qrOffsetY + (qrRenderSize - totalBackgroundSize) / 2;
        ctx.fillStyle = 'white';
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + totalBackgroundSize - radius, y);
        ctx.quadraticCurveTo(x + totalBackgroundSize, y, x + totalBackgroundSize, y + radius);
        ctx.lineTo(x + totalBackgroundSize, y + totalBackgroundSize - radius);
        ctx.quadraticCurveTo(x + totalBackgroundSize, y + totalBackgroundSize, x + totalBackgroundSize - radius, y + totalBackgroundSize);
        ctx.lineTo(x + radius, y + totalBackgroundSize);
        ctx.quadraticCurveTo(x, y + totalBackgroundSize, x, y + totalBackgroundSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Position sticker in center of background
        const stickerX = x + padding;
        const stickerY = y + padding + 3;

        if (selectedSticker.startsWith('data:')) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, stickerX, stickerY, stickerSize, stickerSize);
          };
          img.src = selectedSticker;
        } else {
          ctx.font = `${stickerSize * 0.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000';
          ctx.fillText(selectedSticker, stickerX + stickerSize / 2, stickerY + stickerSize / 2);
        }
      }

      // Apply logo if selected (centered on the QR area)
      if (selectedLogo) {
        const logoSize = 50; // Fixed 50x50px size
        const x = qrOffsetX + (qrRenderSize - logoSize) / 2;
        const y = qrOffsetY + (qrRenderSize - logoSize) / 2;

        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.roundRect(x - 2, y - 2, logoSize + 4, logoSize + 4, 4);
          ctx.fill();
          ctx.drawImage(img, x, y, logoSize, logoSize);
        };
        img.src = selectedLogo;
      }
    };

    renderPreview().catch((error) => {
      console.error('Failed to render QR preview:', error);
    });
  }, [
    qrContent, qrColor, bgColor, qrSize, errorCorrectionLevel, includeMargin,
    selectedSticker, selectedLogo, selectedFrame, framePhrase, frameFont, frameColor,
    canvasRef
  ]);
};

/**
 * Component that renders QR code preview canvas
 */
export const QRPreview = ({ 
  qrContent,
  qrColor = '#000000',
  bgColor = '#ffffff',
  qrSize = 280,
  errorCorrectionLevel = 'H',
  includeMargin = true,
  selectedSticker = null,
  selectedLogo = null,
  selectedFrame = 'none',
  frameColor = '#000000',
  framePhrase = 'SCAN ME',
  frameFont = 'Arial',
  style = {}
}) => {
  const canvasRef = useRef(null);

  useQRRenderer({
    qrContent,
    qrColor,
    bgColor,
    qrSize,
    errorCorrectionLevel,
    includeMargin,
    selectedSticker,
    selectedLogo,
    selectedFrame,
    frameColor,
    framePhrase,
    frameFont
  }, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '311px',
        aspectRatio: '1 / 1',
        height: 'auto',
        borderRadius: '16px',
        background: '#ffffff',
        ...style
      }}
    />
  );
};

export default QRPreview;