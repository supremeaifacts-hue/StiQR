import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import StickerPicker from './StickerPicker';
import { useAuth } from './contexts/AuthContext';

const EditorPage = ({ onBack, onGoToDashboard, onGoToProfile, embedded = false, qrCodeToEdit, onClearQrCodeToEdit }) => {
  const [selectedType, setSelectedType] = useState('url');
  const [qrData, setQrData] = useState('');
  const [qrMode, setQrMode] = useState('static');
  const [designTab, setDesignTab] = useState('frame');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H');
  const [includeMargin, setIncludeMargin] = useState(true);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [qrSize, setQrSize] = useState(300);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [userLogos, setUserLogos] = useState([]);
  const [loadingLogos, setLoadingLogos] = useState(false);
  
  const { isAuthenticated, saveLogo, saveQrCode, getUserAssets, canCreateDynamicQrCodes, getTrialDaysLeft, isProUser } = useAuth();
  
  // Frame customization state
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [framePhrase, setFramePhrase] = useState('Your Text');
  const [frameFont, setFrameFont] = useState('Arial');
  const [frameColor, setFrameColor] = useState('#000000');
  
  const canvasRef = useRef(null);

  // Fetch user logos when component mounts or authentication changes
  useEffect(() => {
    const fetchUserLogos = async () => {
      if (isAuthenticated) {
        setLoadingLogos(true);
        try {
          const assets = await getUserAssets();
          setUserLogos(assets.logos || []);
        } catch (error) {
          console.error('Failed to fetch user logos:', error);
          setUserLogos([]);
        } finally {
          setLoadingLogos(false);
        }
      } else {
        setUserLogos([]);
      }
    };
    
    fetchUserLogos();
  }, [isAuthenticated, getUserAssets]);

  // Pre-fill form when qrCodeToEdit is provided
  useEffect(() => {
    if (qrCodeToEdit) {
      console.log('Pre-filling form with QR code data:', qrCodeToEdit);
      
      // Set QR code data
      if (qrCodeToEdit.data) {
        setQrData(qrCodeToEdit.data);
      }
      
      // Set QR code name as frame phrase if available
      if (qrCodeToEdit.name) {
        setFramePhrase(qrCodeToEdit.name);
      }
      
      // Try to get design characteristics from qrCodeToEdit.design first
      let designCharacteristics = qrCodeToEdit.design;
      
      // If not in qrCodeToEdit.design, try to get from localStorage as fallback
      if (!designCharacteristics && qrCodeToEdit.id) {
        const designStorageKey = `qr_design_${qrCodeToEdit.id}`;
        const storedDesign = localStorage.getItem(designStorageKey);
        if (storedDesign) {
          try {
            designCharacteristics = JSON.parse(storedDesign);
            console.log('Retrieved design characteristics from localStorage fallback:', designCharacteristics);
          } catch (error) {
            console.error('Error parsing design characteristics from localStorage:', error);
          }
        }
      }
      
      // Restore design characteristics if available
      if (designCharacteristics) {
        const design = designCharacteristics;
        
        // Restore QR color
        if (design.qrColor) {
          setQrColor(design.qrColor);
        }
        
        // Restore background color
        if (design.bgColor) {
          setBgColor(design.bgColor);
        }
        
        // Restore frame
        if (design.selectedFrame) {
          setSelectedFrame(design.selectedFrame);
        }
        
        // Restore frame color
        if (design.frameColor) {
          setFrameColor(design.frameColor);
        }
        
        // Restore frame font
        if (design.frameFont) {
          setFrameFont(design.frameFont);
        }
        
        // Restore sticker
        if (design.selectedSticker) {
          setSelectedSticker(design.selectedSticker);
        }
        
        // Restore logo
        if (design.selectedLogo) {
          setSelectedLogo(design.selectedLogo);
        }
        
        // Restore error correction level
        if (design.errorCorrectionLevel) {
          setErrorCorrectionLevel(design.errorCorrectionLevel);
        }
        
        // Restore QR mode
        if (design.qrMode) {
          setQrMode(design.qrMode);
        }
        
        // Restore selected type
        if (design.selectedType) {
          setSelectedType(design.selectedType);
        }
        
        // Restore include margin
        if (design.includeMargin !== undefined) {
          setIncludeMargin(design.includeMargin);
        }
        
        // Restore QR size
        if (design.qrSize) {
          setQrSize(design.qrSize);
        }
      }
      
      // Show a message to the user
      alert(`Editing QR code: ${qrCodeToEdit.name || 'Untitled QR Code'}\n\nAll design characteristics have been restored. Make your changes and click "Save to My QR codes" to update it.`);
      
      // Clear the qrCodeToEdit after using it
      if (onClearQrCodeToEdit) {
        // Clear after a short delay to ensure the form is pre-filled
        setTimeout(() => {
          onClearQrCodeToEdit();
        }, 100);
      }
    }
  }, [qrCodeToEdit, onClearQrCodeToEdit]);

  const qrTypes = [
    { id: 'url', label: 'Link' },
    { id: 'text', label: 'Text' },
    { id: 'email', label: 'E-mail' },
    { id: 'sms', label: 'SMS' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'wifi', label: 'WI‑FI' },
    { id: 'pdf', label: 'PDF' },
    { id: 'social', label: 'Social Media' },
    { id: 'event', label: 'Event' },
  ];

  useEffect(() => {
    if (qrData && canvasRef.current) {
      // Set canvas dimensions - extend 250px down for the thicker bottom border
      const canvasWidth = qrSize;
      const canvasHeight = qrSize * 2 + 250; // Double height plus 250px extra for thicker border
      
      // Set canvas dimensions
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      
      // Create 30px white area around QR code
      const whiteAreaPadding = 30;
      const qrWithWhiteAreaSize = qrSize - (whiteAreaPadding * 2);
      
      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: qrWithWhiteAreaSize,
          margin: includeMargin ? 2 : 0,
          color: {
            dark: qrColor,
            light: bgColor,
          },
          errorCorrectionLevel: errorCorrectionLevel,
        },
        (error) => {
          if (error) {
            console.error('QR Code error:', error);
          } else {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Apply frame effects - only rectangle with rounded edges under QR code for "thick-under-text"
            if (selectedFrame !== 'none') {
              const frameConfigs = {
                'thick-under-text': { borderWidth: 6, borderRadius: 0, hasLabel: false, labelPosition: 'below', hasIcon: false },
                'thick-over-text': { borderWidth: 6, borderRadius: 0, hasLabel: false, labelPosition: 'over', hasIcon: false },
              };
              
              const config = frameConfigs[selectedFrame];
              if (config) {
                // For "thick-under-text", draw rectangle with rounded edges at center of QR code (same position as logo center, moved 10px left)
                if (selectedFrame === 'thick-under-text') {
                  const rectangleHeight = qrSize * 0.12;
                  const rectanglePadding = qrSize * 0.05;
                  const rectangleWidth = qrSize - (rectanglePadding * 2);
                  const rectangleRadius = rectangleHeight / 2;
                  const rectangleY = qrSize/2 - 25; // Same Y position as logo center (25px up from center)
                  const labelOffsetX = -10; // Move 10px to the left
                  
                  // Draw rectangle background with rounded edges (moved 10px left)
                  ctx.fillStyle = frameColor;
                  ctx.beginPath();
                  ctx.roundRect(rectanglePadding + labelOffsetX, rectangleY - rectangleHeight/2, rectangleWidth, rectangleHeight, rectangleRadius);
                  ctx.fill();
                  
                  // Draw white border around rectangle
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(rectanglePadding + labelOffsetX, rectangleY - rectangleHeight/2, rectangleWidth, rectangleHeight, rectangleRadius);
                  ctx.stroke();
                  
                  // Draw editable text inside rectangle (also moved 10px left)
                  ctx.fillStyle = '#fff';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.font = `${rectangleHeight * 0.4}px ${frameFont}`;
                  
                  const maxWidth = rectangleWidth * 0.9;
                  let text = framePhrase;
                  
                  // Truncate text if too long
                  const metrics = ctx.measureText(text);
                  if (metrics.width > maxWidth) {
                    while (text.length > 3 && ctx.measureText(text + '...').width > maxWidth) {
                      text = text.slice(0, -1);
                    }
                    text = text + '...';
                  }
                  
                  ctx.fillText(text, qrSize/2 + labelOffsetX, rectangleY);
                }
              }
            }
            
            // Apply sticker if selected (positioned 3px right and 3px down from previous position)
            if (selectedSticker && canvasRef.current) {
              const stickerSize = qrSize * 0.2; // 20% of QR dimension
              const offset = 25; // 3px right and down from previous position: 25px up and left from center
              const x = (qrSize - stickerSize) / 2 - offset;
              const y = (qrSize - stickerSize) / 2 - offset;
              const padding = 6;
              ctx.fillStyle = 'white';
              const radius = 8;
              ctx.beginPath();
              ctx.moveTo(x - padding + radius, y - padding);
              ctx.lineTo(x - padding + stickerSize + padding - radius, y - padding);
              ctx.quadraticCurveTo(x - padding + stickerSize + padding, y - padding, x - padding + stickerSize + padding, y - padding + radius);
              ctx.lineTo(x - padding + stickerSize + padding, y - padding + stickerSize + padding - radius);
              ctx.quadraticCurveTo(x - padding + stickerSize + padding, y - padding + stickerSize + padding, x - padding + stickerSize + padding - radius, y - padding + stickerSize + padding);
              ctx.lineTo(x - padding + radius, y - padding + stickerSize + padding);
              ctx.quadraticCurveTo(x - padding, y - padding + stickerSize + padding, x - padding, y - padding + stickerSize + padding - radius);
              ctx.lineTo(x - padding, y - padding + radius);
              ctx.quadraticCurveTo(x - padding, y - padding, x - padding + radius, y - padding);
              ctx.closePath();
              ctx.fill();

              if (selectedSticker.startsWith('data:')) {
                const img = new Image();
                img.onload = () => {
                  ctx.drawImage(img, x, y, stickerSize, stickerSize);
                };
                img.src = selectedSticker;
              } else {
                ctx.font = `${stickerSize * 0.8}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000';
                ctx.fillText(selectedSticker, x + stickerSize/2, y + stickerSize/2);
              }
            }
            
            // Apply logo if selected (scaled to 50x50px and positioned up-left)
            if (selectedLogo && canvasRef.current) {
              const logoSize = 50; // Fixed 50x50px size
              const offset = 25; // Move 25px up and left from center
              const x = (qrSize - logoSize) / 2 - offset;
              const y = (qrSize - logoSize) / 2 - offset;
              
              const img = new Image();
              img.onload = () => {
                // Draw white background for logo (optional, can be removed for transparent logos)
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.roundRect(x - 2, y - 2, logoSize + 4, logoSize + 4, 4);
                ctx.fill();
                
                // Draw the logo scaled to 50x50px
                ctx.drawImage(img, x, y, logoSize, logoSize);
              };
              img.src = selectedLogo;
            }
          }
        }
      );
    }
  }, [qrData, qrColor, bgColor, qrSize, errorCorrectionLevel, includeMargin, selectedSticker, selectedLogo, selectedFrame, framePhrase, frameFont, frameColor]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, JPEG, or SVG)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const logoData = event.target.result;
        setSelectedLogo(logoData);
        
        // Save logo to backend if user is authenticated
        if (isAuthenticated) {
          try {
            await saveLogo(logoData, file.name);
            console.log('Logo saved to user account');
          } catch (error) {
            console.error('Failed to save logo:', error);
            // Continue anyway - the logo will still be selected
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (canvasRef.current && qrData) {
      // First save QR code to get scan URL (if authenticated)
      let scanUrl = qrData; // Default to original data
      let savedQrCode = null;
      
      if (isAuthenticated) {
        try {
          // Generate current QR code image
          const imageData = canvasRef.current.toDataURL('image/png');
          
          // Save QR code to backend
          savedQrCode = await saveQrCode(qrData, imageData, `QR Code ${new Date().toLocaleDateString()}`);
          console.log('QR code saved to user account:', savedQrCode);
          
          // Use scan URL from backend response if available
          if (savedQrCode && savedQrCode.qrCode && savedQrCode.qrCode.scanUrl) {
            scanUrl = savedQrCode.qrCode.scanUrl;
            console.log('Using scan URL:', scanUrl);
          }
        } catch (error) {
          console.error('Failed to save QR code:', error);
          // Continue with original data
        }
      }
      
      // Generate QR code with scan URL (or original data if not authenticated/saved)
      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize * 2 + 250; // Same dimensions as preview
      
      // Generate QR code with scan URL
      await new Promise((resolve, reject) => {
        QRCode.toCanvas(
          canvas,
          scanUrl,
          {
            width: qrSize - 60, // Account for white area padding
            margin: includeMargin ? 2 : 0,
            color: {
              dark: qrColor,
              light: bgColor,
            },
            errorCorrectionLevel: errorCorrectionLevel,
          },
          (error) => {
            if (error) {
              console.error('QR Code generation error:', error);
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });
      
      // Apply same customizations as preview
      const ctx = canvas.getContext('2d');
      
      // Apply frame effects
      if (selectedFrame !== 'none') {
        const frameConfigs = {
          'thick-under-text': { borderWidth: 6, borderRadius: 0, hasLabel: false, labelPosition: 'below', hasIcon: false },
          'thick-over-text': { borderWidth: 6, borderRadius: 0, hasLabel: false, labelPosition: 'over', hasIcon: false },
        };
        
        const config = frameConfigs[selectedFrame];
        if (config && selectedFrame === 'thick-under-text') {
          const rectangleHeight = qrSize * 0.12;
          const rectanglePadding = qrSize * 0.05;
          const rectangleWidth = qrSize - (rectanglePadding * 2);
          const rectangleRadius = rectangleHeight / 2;
          const rectangleY = qrSize/2 - 25;
          const labelOffsetX = -10;
          
          // Draw rectangle background with rounded edges
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(rectanglePadding + labelOffsetX, rectangleY - rectangleHeight/2, rectangleWidth, rectangleHeight, rectangleRadius);
          ctx.fill();
          
          // Draw white border around rectangle
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(rectanglePadding + labelOffsetX, rectangleY - rectangleHeight/2, rectangleWidth, rectangleHeight, rectangleRadius);
          ctx.stroke();
          
          // Draw editable text inside rectangle
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `${rectangleHeight * 0.4}px ${frameFont}`;
          
          const maxWidth = rectangleWidth * 0.9;
          let text = framePhrase;
          
          // Truncate text if too long
          const metrics = ctx.measureText(text);
          if (metrics.width > maxWidth) {
            while (text.length > 3 && ctx.measureText(text + '...').width > maxWidth) {
              text = text.slice(0, -1);
            }
            text = text + '...';
          }
          
          ctx.fillText(text, qrSize/2 + labelOffsetX, rectangleY);
        }
      }
      
      // Apply sticker if selected
      if (selectedSticker) {
        const stickerSize = qrSize * 0.2;
        const offset = 25;
        const x = (qrSize - stickerSize) / 2 - offset;
        const y = (qrSize - stickerSize) / 2 - offset;
        const padding = 6;
        ctx.fillStyle = 'white';
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(x - padding + radius, y - padding);
        ctx.lineTo(x - padding + stickerSize + padding - radius, y - padding);
        ctx.quadraticCurveTo(x - padding + stickerSize + padding, y - padding, x - padding + stickerSize + padding, y - padding + radius);
        ctx.lineTo(x - padding + stickerSize + padding, y - padding + stickerSize + padding - radius);
        ctx.quadraticCurveTo(x - padding + stickerSize + padding, y - padding + stickerSize + padding, x - padding + stickerSize + padding - radius, y - padding + stickerSize + padding);
        ctx.lineTo(x - padding + radius, y - padding + stickerSize + padding);
        ctx.quadraticCurveTo(x - padding, y - padding + stickerSize + padding, x - padding, y - padding + stickerSize + padding - radius);
        ctx.lineTo(x - padding, y - padding + radius);
        ctx.quadraticCurveTo(x - padding, y - padding, x - padding + radius, y - padding);
        ctx.closePath();
        ctx.fill();

        if (selectedSticker.startsWith('data:')) {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, stickerSize, stickerSize);
              resolve();
            };
            img.onerror = reject;
            img.src = selectedSticker;
          });
        } else {
          ctx.font = `${stickerSize * 0.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000';
          ctx.fillText(selectedSticker, x + stickerSize/2, y + stickerSize/2);
        }
      }
      
      // Apply logo if selected
      if (selectedLogo) {
        const logoSize = 50;
        const offset = 25;
        const x = (qrSize - logoSize) / 2 - offset;
        const y = (qrSize - logoSize) / 2 - offset;
        
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Draw white background for logo
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.roundRect(x - 2, y - 2, logoSize + 4, logoSize + 4, 4);
            ctx.fill();
            
            // Draw the logo
            ctx.drawImage(img, x, y, logoSize, logoSize);
            resolve();
          };
          img.onerror = reject;
          img.src = selectedLogo;
        });
      }
      
      // Download the QR code
      const finalImageData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = finalImageData;
      link.download = `qrcode_${Date.now()}.png`;
      link.click();
      
      // If we saved the QR code but didn't get a scan URL (demo mode or error),
      // we should update the saved QR code with the final image
      if (isAuthenticated && savedQrCode && savedQrCode.qrCode && !savedQrCode.qrCode.scanUrl) {
        try {
          // The QR code was saved but we need to update it with the final image
          // (This would require an update endpoint, but for now we'll just log)
          console.log('QR code saved without scan URL (demo mode?)');
        } catch (error) {
          console.error('Failed to update QR code image:', error);
        }
      }
    }
  };

  const editorContent = (
    <div style={{
      display: 'flex',
      flex: 1,
      flexDirection: 'row',
      gap: '30px',
      width: '100%',
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: '440px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '30px',
        borderRadius: '24px',
        border: '1px solid rgba(0, 217, 255, 0.1)',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 10px 0', color: '#00D9FF' }}>
          QR Editor
        </h1>

        {/* Type selector */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(0,217,255,0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '30px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '12px' }}>
            {qrTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                style={{
                  background: selectedType === type.id ? '#00D9FF' : 'transparent',
                  color: selectedType === type.id ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>
                  {type.id === 'url' && '🔗'}
                  {type.id === 'text' && '📝'}
                  {type.id === 'email' && '✉️'}
                  {type.id === 'sms' && '💬'}
                  {type.id === 'whatsapp' && '📱'}
                  {type.id === 'wifi' && '📶'}
                  {type.id === 'pdf' && '📄'}
                  {type.id === 'social' && '🔗'}
                  {type.id === 'event' && '📅'}
                </span>
                {type.label}
              </button>
            ))}
          </div>
        </div>


        <div style={{
          background: 'rgba(0, 217, 255, 0.08)',
          border: '1px solid rgba(0, 217, 255, 0.2)',
          borderRadius: '14px',
          padding: '18px',
          marginBottom: '24px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#ccc', fontWeight: '600', textAlign: 'left' }}>
            1. Choose the Kind of QR Code:
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            <button
              onClick={() => setQrMode('static')}
              style={{
                flex: 1,
                padding: '12px',
                background: qrMode === 'static' ? '#00D9FF' : 'rgba(0, 217, 255, 0.2)',
                color: qrMode === 'static' ? '#000' : '#00D9FF',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
              }}
            >
              Static QR
            </button>
            <button
              onClick={() => {
                setQrMode('dynamic');
                if (!isAuthenticated) {
                  // Show login prompt or message
                  console.log('User needs to login for dynamic QR codes');
                }
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: qrMode === 'dynamic' ? '#00D9FF' : 'rgba(0, 217, 255, 0.2)',
                color: qrMode === 'dynamic' ? '#000' : '#00D9FF',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
              }}
            >
              Dynamic QR
            </button>
          </div>
          {qrMode === 'dynamic' && !isAuthenticated && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(255, 0, 255, 0.1)',
              border: '1px solid rgba(255, 0, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#FF00FF',
              textAlign: 'center',
            }}>
              🔒 Login to create a Dynamic QR code
            </div>
          )}
          {qrMode === 'dynamic' && isAuthenticated && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(0, 217, 255, 0.1)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#00D9FF',
              textAlign: 'center',
            }}>
              {canCreateDynamicQrCodes() ? (
                isProUser() ? (
                  <span>✅ Pro Plan: Unlimited Dynamic QR codes</span>
                ) : (
                  <span>⭐ Trial: {getTrialDaysLeft()} days left. <a href="/pricing" style={{color: '#FF00FF', textDecoration: 'underline'}}>Upgrade to Pro</a></span>
                )
              ) : (
                <span>⛔ Trial expired. <a href="/pricing" style={{color: '#FF00FF', textDecoration: 'underline'}}>Subscribe to Pro plan</a></span>
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888', marginBottom: '10px' }}>
              <span>🔗</span> 2. Complete the Content:
            </label>
              <input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Enter URL or data..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0, 217, 255, 0.05)',
                  border: '1px solid rgba(0, 217, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                Reliability & Complexity
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { label: 'LOW', value: 'L' },
                  { label: 'MEDIUM', value: 'M' },
                  { label: 'HIGH', value: 'Q' },
                  { label: 'HIGHEST', value: 'H' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setErrorCorrectionLevel(level.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: errorCorrectionLevel === level.value ? '#00D9FF' : 'rgba(0, 217, 255, 0.1)',
                      color: errorCorrectionLevel === level.value ? '#000' : '#00D9FF',
                      border: `1px solid ${errorCorrectionLevel === level.value ? '#00D9FF' : 'rgba(0, 217, 255, 0.3)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '11px',
                    }}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              marginBottom: '30px',
              padding: '18px',
              background: 'rgba(0, 217, 255, 0.05)',
              border: '1px solid rgba(0, 217, 255, 0.2)',
              borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>
                <span>🎨</span> 3. Design Your QR Code:
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                {['frame', 'shape', 'logo'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDesignTab(tab)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '16px',
                      border: designTab === tab ? '2px solid #00D9FF' : '1px solid rgba(255, 255, 255, 0.25)',
                      background: designTab === tab ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
                      color: designTab === tab ? '#00D9FF' : '#ccc',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {tab === 'frame' ? 'Frame' : tab === 'shape' ? 'Color' : 'Logo'}
                  </button>
                ))}
              </div>

              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.15)' }}>
                {designTab === 'frame' && (
                  <div>
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>
                      Choose a frame style:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {[
                        { 
                          id: 'none', 
                          label: 'No Frame',
                          borderStyle: 'none', 
                          borderWidth: '0px', 
                          borderColor: 'transparent',
                          hasLabel: false,
                          labelPosition: 'none',
                          hasIcon: false
                        },
                        { 
                          id: 'thick-under-text', 
                          label: 'Thick Border Under Text',
                          borderStyle: 'solid', 
                          borderWidth: '6px', 
                          borderColor: '#00D9FF',
                          hasLabel: true,
                          labelPosition: 'below',
                          hasIcon: false
                        },
                        { 
                          id: 'thick-over-text', 
                          label: 'Thick Border Over Text',
                          borderStyle: 'solid', 
                          borderWidth: '6px', 
                          borderColor: '#00D9FF',
                          hasLabel: true,
                          labelPosition: 'over',
                          hasIcon: false
                        },
                      ].map((frame) => (
                        <div
                          key={frame.id}
                          onClick={() => setSelectedFrame(frame.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: selectedFrame === frame.id ? 'rgba(0, 217, 255, 0.15)' : 'rgba(0, 217, 255, 0.05)',
                            border: selectedFrame === frame.id ? '2px solid #00D9FF' : '2px solid rgba(0, 217, 255, 0.2)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            padding: '10px',
                            height: '120px',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedFrame !== frame.id) {
                              e.currentTarget.style.borderColor = '#00D9FF';
                              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedFrame !== frame.id) {
                              e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.2)';
                              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.05)';
                            }
                          }}
                        >
                          {/* Mini QR Preview with frame style */}
                          <div style={{
                            width: '60px',
                            height: '60px',
                            background: '#fff',
                            borderStyle: frame.borderStyle,
                            borderRadius: frame.isCircle ? '50%' : frame.borderRadius,
                            borderWidth: frame.borderWidth,
                            borderColor: frame.borderColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '6px',
                            boxSizing: 'border-box',
                            position: 'relative',
                            overflow: 'hidden',
                          }}>
                            {/* Mini QR code pattern */}
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                              <rect x="4" y="4" width="10" height="10" fill="#000"/>
                              <rect x="26" y="4" width="10" height="10" fill="#000"/>
                              <rect x="4" y="26" width="10" height="10" fill="#000"/>
                              <rect x="6" y="6" width="6" height="6" fill="#fff"/>
                              <rect x="28" y="6" width="6" height="6" fill="#fff"/>
                              <rect x="6" y="28" width="6" height="6" fill="#fff"/>
                              <rect x="16" y="4" width="3" height="3" fill="#000"/>
                              <rect x="20" y="4" width="3" height="3" fill="#000"/>
                              <rect x="16" y="8" width="3" height="3" fill="#000"/>
                              <rect x="18" y="16" width="5" height="5" fill="#000"/>
                              <rect x="16" y="20" width="3" height="3" fill="#000"/>
                              <rect x="22" y="18" width="3" height="3" fill="#000"/>
                              <rect x="26" y="18" width="3" height="3" fill="#000"/>
                              <rect x="30" y="22" width="3" height="3" fill="#000"/>
                              <rect x="18" y="26" width="3" height="3" fill="#000"/>
                              <rect x="22" y="28" width="3" height="3" fill="#000"/>
                              <rect x="26" y="26" width="5" height="5" fill="#000"/>
                              <rect x="30" y="30" width="3" height="3" fill="#000"/>
                            </svg>
                            
                            {/* Round label overlay for frames with labels */}
                            {frame.hasLabel && frame.labelPosition === 'over' && (
                              <div style={{
                                position: 'absolute',
                                top: '-30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#00D9FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white',
                              }}>
                                {frame.hasIcon && (
                                  <span style={{ fontSize: '10px', color: 'white' }}>QR</span>
                                )}
                              </div>
                            )}
                            
                            {/* Round label underlay for frames with labels under */}
                            {frame.hasLabel && frame.labelPosition === 'under' && (
                              <div style={{
                                position: 'absolute',
                                bottom: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#FF00FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white',
                              }}>
                                {frame.hasIcon && (
                                  <span style={{ fontSize: '10px', color: 'white' }}>QR</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Text label below for circle frame */}
                          {frame.isCircle && (
                            <div style={{
                              marginTop: '4px',
                              padding: '2px 6px',
                              background: 'transparent',
                              borderRadius: '4px',
                              fontSize: '8px',
                              color: '#ccc',
                              textAlign: 'center',
                            }}>
                              Your Text
                            </div>
                          )}
                          
                          <span style={{ fontSize: '9px', color: '#ccc', fontWeight: '600', textAlign: 'center', marginTop: '4px' }}>{frame.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Frame customization controls */}
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 217, 255, 0.05)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#aaa', fontWeight: '600', marginBottom: '12px' }}>
                        Frame Customization:
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Frame phrase input */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: '#ccc', fontWeight: '600' }}>
                            Frame phrase:
                          </label>
                          <input
                            type="text"
                            value={framePhrase}
                            onChange={(e) => setFramePhrase(e.target.value)}
                            placeholder="Enter text for frame label..."
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: 'rgba(0, 217, 255, 0.05)',
                              border: '1px solid rgba(0, 217, 255, 0.2)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        
                        {/* Phrase font selection */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: '#ccc', fontWeight: '600' }}>
                            Phrase font:
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['Arial', 'Courier', 'Georgia'].map((font) => (
                              <button
                                key={font}
                                onClick={() => setFrameFont(font)}
                                style={{
                                  flex: 1,
                                  padding: '6px',
                                  background: frameFont === font ? '#00D9FF' : 'rgba(0, 217, 255, 0.1)',
                                  border: `1px solid ${frameFont === font ? '#00D9FF' : 'rgba(0, 217, 255, 0.3)'}`,
                                  borderRadius: '4px',
                                  color: frameFont === font ? '#000' : '#ccc',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                              >
                                {font}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Frame color selection */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: '#ccc', fontWeight: '600' }}>
                            Frame color:
                          </label>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                              '#000000', '#FF00FF', '#00FF00', '#FFFF00', '#FF9900', '#FF0000', '#9900FF'
                            ].map((color) => (
                              <div
                                key={color}
                                onClick={() => setFrameColor(color)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: color,
                                  border: frameColor === color ? '3px solid white' : '2px solid white',
                                  cursor: 'pointer',
                                  boxShadow: frameColor === color ? '0 0 8px rgba(0,0,0,0.5)' : '0 0 4px rgba(0,0,0,0.3)',
                                  transform: frameColor === color ? 'scale(1.1)' : 'scale(1)',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {designTab === 'shape' && (
                  <div>
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>
                      Choose a color for your QR code:
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {[
                        { id: '#000000', label: 'Black', color: '#000000' },
                        { id: '#FF00FF', label: 'Magenta', color: '#FF00FF' },
                        { id: '#00FF00', label: 'Green', color: '#00FF00' },
                        { id: '#FFFF00', label: 'Yellow', color: '#FFFF00' },
                        { id: '#FF9900', label: 'Orange', color: '#FF9900' },
                        { id: '#FF0000', label: 'Red', color: '#FF0000' },
                        { id: '#9900FF', label: 'Purple', color: '#9900FF' },
                      ].map((colorOption) => (
                        <div
                          key={colorOption.id}
                          onClick={() => setQrColor(colorOption.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: qrColor === colorOption.id ? 'rgba(0, 217, 255, 0.15)' : 'rgba(0, 217, 255, 0.05)',
                            border: qrColor === colorOption.id ? '2px solid #00D9FF' : '2px solid rgba(0, 217, 255, 0.2)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            padding: '10px',
                            width: '80px',
                            height: '80px',
                          }}
                          onMouseEnter={(e) => {
                            if (qrColor !== colorOption.id) {
                              e.currentTarget.style.borderColor = '#00D9FF';
                              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (qrColor !== colorOption.id) {
                              e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.2)';
                              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.05)';
                            }
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: colorOption.color,
                            borderRadius: '8px',
                            marginBottom: '6px',
                            boxSizing: 'border-box',
                            border: '2px solid white',
                            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                          }}>
                          </div>
                          <span style={{ fontSize: '9px', color: '#ccc', fontWeight: '600', textAlign: 'center' }}>{colorOption.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(0, 217, 255, 0.05)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', marginBottom: '8px' }}>
                        Selected Color: <span style={{ color: qrColor, fontWeight: '700' }}>{qrColor}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          background: qrColor,
                          borderRadius: '4px',
                          border: '2px solid white',
                        }}></div>
                        <div style={{ fontSize: '10px', color: '#ccc' }}>
                          This color will be applied to the QR code pattern (not the frame)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {designTab === 'logo' && (
                  <div>
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>
                      Add a logo or image:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="file"
                        id="logo-upload"
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="logo-upload"
                        style={{
                          padding: '12px',
                          background: 'rgba(0, 217, 255, 0.1)',
                          border: '2px dashed rgba(0, 217, 255, 0.3)',
                          borderRadius: '8px',
                          color: '#00D9FF',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          textAlign: 'center',
                          display: 'block',
                        }}
                      >
                        📁 Upload Logo
                      </label>
                      <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>
                        Recommended: PNG with transparent background
                      </div>
                      
                      {/* Saved Logos Section */}
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(0, 217, 255, 0.2)' }}>
                        {isAuthenticated ? (
                          <div>
                            <div style={{ fontSize: '12px', color: '#aaa', fontWeight: '600', marginBottom: '12px' }}>
                              Your Saved Logos ({userLogos.length})
                            </div>
                            {loadingLogos ? (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>
                                Loading your logos...
                              </div>
                            ) : userLogos.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
                                {userLogos.map((logo, index) => (
                                  <div
                                    key={logo.id || index}
                                    onClick={() => setSelectedLogo(logo.data)}
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      border: selectedLogo === logo.data ? '2px solid #00D9FF' : '1px solid rgba(255, 255, 255, 0.2)',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                      color: '#fff',
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      transition: 'all 0.2s ease',
                                    }}
                                    title={logo.name}
                                    onMouseEnter={(e) => {
                                      if (selectedLogo !== logo.data) {
                                        e.currentTarget.style.borderColor = '#00D9FF';
                                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedLogo !== logo.data) {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                      }
                                    }}
                                  >
                                    {logo.data.startsWith('data:') ? (
                                      <img 
                                        src={logo.data} 
                                        alt={logo.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                      />
                                    ) : (
                                      logo.data
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>
                                No logos saved yet. Upload a logo to see it here.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0, 217, 255, 0.05)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#00D9FF', fontWeight: '600', marginBottom: '8px' }}>
                              Login to use your saved logos
                            </div>
                            <div style={{ fontSize: '10px', color: '#888' }}>
                              Sign in to access and reuse your previously uploaded logos
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>
                <span>✨</span> Center Sticker
              </label>
              <button
                onClick={() => setShowStickerPicker(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #FF00FF 0%, #FF1493 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✨ Add Sticker
              </button>
              {selectedSticker && (
                <div style={{
                  marginTop: '10px',
                  textAlign: 'center',
                  fontSize: '24px',
                  padding: '10px',
                  background: 'rgba(0, 217, 255, 0.1)',
                  borderRadius: '8px',
                }}>
                  {selectedSticker.startsWith('data:') ? (
                    <img src={selectedSticker} alt="sticker" style={{ maxWidth: '60px', maxHeight: '60px' }} />
                  ) : (
                    selectedSticker
                  )}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Right Preview */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
      }}>
        <div style={{
          padding: '80px', // Reduced by 50px (130px - 50px)
          background: '#fff',
          borderRadius: '20px',
          border: '2px solid #00D9FF',
          boxShadow: '0 0 40px rgba(0, 217, 255, 0.3)',
          marginBottom: '40px',
        }}>
          <canvas ref={canvasRef} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #00D9FF 0%, #FF00FF 100%)',
              border: 'none',
              borderRadius: '20px',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 0 30px rgba(0, 217, 255, 0.5)',
            }}
          >
            Download QR Code
          </button>
          <button
            onClick={async () => {
              if (!isAuthenticated) {
                alert('Please login to save QR codes to your collection');
                return;
              }
              
              if (!qrData) {
                alert('Please create a QR code first');
                return;
              }
              
              try {
                // Generate current QR code image
                const imageData = canvasRef.current.toDataURL('image/png');
                
                // Create design characteristics object
                const designCharacteristics = {
                  qrColor,
                  bgColor,
                  selectedFrame,
                  frameColor,
                  frameFont,
                  framePhrase,
                  selectedSticker,
                  selectedLogo,
                  errorCorrectionLevel,
                  qrMode,
                  selectedType,
                  includeMargin,
                  qrSize
                };
                
                // Check if we're editing an existing QR code
                const isEditing = qrCodeToEdit && qrCodeToEdit.id;
                
                // Save QR code to backend with design characteristics
                const savedQrCode = await saveQrCode(
                  qrData, 
                  imageData, 
                  framePhrase || `QR Code ${new Date().toLocaleDateString()}`,
                  designCharacteristics
                );
                console.log('QR code saved to user account:', savedQrCode);
                
                if (isEditing) {
                  alert(`QR code "${framePhrase || 'Untitled QR Code'}" updated successfully!\n\nThe modified QR code has overwritten the old version in your Dashboard > My QR codes.`);
                } else {
                  alert('QR code saved to your collection! You can find it in Dashboard > My QR codes.');
                }
                
              } catch (error) {
                console.error('Failed to save QR code:', error);
                alert('Failed to save QR code. Please try again.');
              }
            }}
            style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #00FF00 0%, #00D9FF 100%)',
              border: 'none',
              borderRadius: '20px',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)',
            }}
          >
            💾 Save to My QR codes
          </button>
        </div>
      </div>
    </div>
  );

  const stickerPicker = showStickerPicker ? (
    <StickerPicker
      onSelectSticker={(sticker) => setSelectedSticker(sticker)}
      onClose={() => setShowStickerPicker(false)}
    />
  ) : null;

  if (embedded) {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '60px 20px',
        boxSizing: 'border-box',
      }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          {editorContent}
          {stickerPicker}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(0, 217, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #00D9FF',
              borderRadius: '8px',
              color: '#00D9FF',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Homepage
          </button>
          <button
            onClick={onGoToDashboard}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #FF00FF',
              borderRadius: '8px',
              color: '#FF00FF',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Dashboard
          </button>
          <button
            onClick={onGoToProfile}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #888',
              borderRadius: '8px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Profile
          </button>
        </div>
      </header>

      {editorContent}
      {stickerPicker}
    </div>
  );
};

export default EditorPage;
