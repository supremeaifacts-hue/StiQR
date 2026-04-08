/**
 * Export and sharing functions for QR codes
 */

/**
 * Download QR code as PNG image
 * @param {HTMLCanvasElement} canvas - Canvas element containing QR code
 * @param {string} filename - Optional filename for download
 */
export const downloadQRCode = (canvas, filename = null) => {
  if (!canvas) {
    alert('QR code preview is not ready. Please wait a moment.');
    return false;
  }
  
  const finalImageData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = finalImageData;
  link.download = filename || `qrcode_${Date.now()}.png`;
  link.click();
  
  return true;
};

/**
 * Save QR code to user account
 * @param {Object} params - Parameters for saving QR code
 * @param {string} params.qrContent - Formatted QR code content
 * @param {HTMLCanvasElement} params.canvas - Canvas element
 * @param {string} params.name - Name for the QR code
 * @param {Object} params.designCharacteristics - Design characteristics
 * @param {Function} params.saveQrCode - Function to save QR code to backend
 * @param {boolean} params.isAuthenticated - Whether user is authenticated
 * @returns {Promise<Object>} Saved QR code data or null if failed
 */
export const saveQRCodeToAccount = async ({
  qrContent,
  canvas,
  name,
  designCharacteristics,
  saveQrCode,
  isAuthenticated
}) => {
  if (!isAuthenticated) {
    alert('Please login to save QR codes to your collection');
    return null;
  }
  
  if (!qrContent) {
    alert('Please create a QR code first');
    return null;
  }
  
  if (!canvas) {
    alert('QR code preview is not ready. Please wait a moment.');
    return null;
  }
  
  try {
    // Generate current QR code image
    const imageData = canvas.toDataURL('image/png');
    
    // Save QR code to backend with design characteristics
    const savedQrCode = await saveQrCode(
      qrContent,
      imageData,
      name || `QR Code ${new Date().toLocaleDateString()}`,
      designCharacteristics
    );
    
    console.log('QR code saved to user account:', savedQrCode);
    return savedQrCode;
  } catch (error) {
    console.error('Failed to save QR code:', error);
    alert('Failed to save QR code. Please try again.');
    return null;
  }
};

/**
 * Handle QR code download with optional save to account
 * @param {Object} params - Parameters for download
 * @param {string} params.qrContent - Formatted QR code content
 * @param {HTMLCanvasElement} params.canvas - Canvas element
 * @param {Function} params.saveQrCode - Function to save QR code to backend
 * @param {boolean} params.isAuthenticated - Whether user is authenticated
 * @param {boolean} params.autoSave - Whether to automatically save to account
 * @returns {Promise<Object>} Result object with success status and saved QR code data
 */
export const handleDownloadWithSave = async ({
  qrContent,
  canvas,
  saveQrCode,
  isAuthenticated,
  autoSave = true
}) => {
  if (!qrContent) {
    alert('Please enter content for the QR code first');
    return { success: false, savedQrCode: null };
  }
  
  if (!canvas) {
    alert('QR code preview is not ready. Please wait a moment.');
    return { success: false, savedQrCode: null };
  }
  
  // First save QR code to get scan URL (if authenticated and autoSave is enabled)
  let savedQrCode = null;
  
  if (isAuthenticated && autoSave) {
    try {
      // Generate current QR code image from the preview canvas
      const imageData = canvas.toDataURL('image/png');
      
      // Save QR code to backend
      savedQrCode = await saveQrCode(qrContent, imageData, `QR Code ${new Date().toLocaleDateString()}`);
      console.log('QR code saved to user account:', savedQrCode);
    } catch (error) {
      console.error('Failed to save QR code:', error);
      // Continue anyway - user can still download
    }
  }
  
  // Download the current preview canvas
  const success = downloadQRCode(canvas);
  
  // If we saved the QR code but didn't get a scan URL (demo mode or error),
  // we should update the saved QR code with the final image
  if (isAuthenticated && savedQrCode && savedQrCode.qrCode && !savedQrCode.qrCode.scanUrl) {
    try {
      console.log('QR code saved without scan URL (demo mode?)');
    } catch (error) {
      console.error('Failed to update QR code image:', error);
    }
  }
  
  return { success, savedQrCode };
};

/**
 * Get design characteristics object from form state
 * @param {Object} formState - Form state object
 * @returns {Object} Design characteristics
 */
export const getDesignCharacteristics = (formState) => {
  return {
    qrColor: formState.qrColor,
    bgColor: formState.bgColor,
    selectedFrame: formState.selectedFrame,
    frameColor: formState.frameColor,
    frameFont: formState.frameFont,
    framePhrase: formState.framePhrase,
    selectedSticker: formState.selectedSticker,
    selectedLogo: formState.selectedLogo,
    errorCorrectionLevel: formState.errorCorrectionLevel,
    qrMode: formState.qrMode,
    selectedType: formState.selectedType,
    emailAddress: formState.emailAddress,
    emailSubject: formState.emailSubject,
    emailBody: formState.emailBody,
    includeMargin: formState.includeMargin,
    qrSize: formState.qrSize
  };
};

/**
 * Share QR code via social media or other platforms
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} platform - Platform to share to ('twitter', 'facebook', 'linkedin', 'whatsapp')
 * @param {string} text - Optional text to include with share
 */
export const shareQRCode = (canvas, platform = 'twitter', text = 'Check out my QR code!') => {
  if (!canvas) {
    alert('QR code preview is not ready. Please wait a moment.');
    return;
  }
  
  const imageData = canvas.toDataURL('image/png');
  
  // For now, we'll just download the image since social sharing requires
  // server-side hosting or using Web Share API
  if (navigator.share) {
    // Use Web Share API if available
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'qrcode.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My QR Code',
            text: text
          });
        } catch (error) {
          console.error('Error sharing:', error);
          // Fallback to download
          downloadQRCode(canvas);
        }
      } else {
        // Fallback to download
        downloadQRCode(canvas);
      }
    });
  } else {
    // Fallback to download
    downloadQRCode(canvas);
    alert(`QR code downloaded. You can now share it on ${platform}.`);
  }
};

export default {
  downloadQRCode,
  saveQRCodeToAccount,
  handleDownloadWithSave,
  getDesignCharacteristics,
  shareQRCode
};