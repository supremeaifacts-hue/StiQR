import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

const QRCustomizer = ({ onCustomizationChange }) => {
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [eyeStyle, setEyeStyle] = useState('square');
  const [moduleShape, setModuleShape] = useState('square');

  const handleFgColorChange = (color) => {
    setFgColor(color.hex);
    onCustomizationChange({ fgColor: color.hex, bgColor, transparentBg, eyeStyle, moduleShape });
  };

  const handleBgColorChange = (color) => {
    setBgColor(color.hex);
    onCustomizationChange({ fgColor, bgColor: color.hex, transparentBg, eyeStyle, moduleShape });
  };

  const handleTransparentToggle = () => {
    setTransparentBg(!transparentBg);
    onCustomizationChange({ fgColor, bgColor, transparentBg: !transparentBg, eyeStyle, moduleShape });
  };

  const handleEyeStyleChange = (style) => {
    setEyeStyle(style);
    onCustomizationChange({ fgColor, bgColor, transparentBg, eyeStyle: style, moduleShape });
  };

  const handleModuleShapeChange = (shape) => {
    setModuleShape(shape);
    onCustomizationChange({ fgColor, bgColor, transparentBg, eyeStyle, moduleShape: shape });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#00D9FF' }}>Step 2: Customize QR Code</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Colors</h4>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <label>Foreground Color:</label>
            <SketchPicker color={fgColor} onChangeComplete={handleFgColorChange} />
          </div>
          <div>
            <label>Background Color:</label>
            <SketchPicker color={bgColor} onChangeComplete={handleBgColorChange} />
            <label style={{ marginTop: '10px' }}>
              <input type="checkbox" checked={transparentBg} onChange={handleTransparentToggle} />
              Transparent Background
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Pattern & Shape</h4>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <label>Eye Style:</label>
            <select value={eyeStyle} onChange={(e) => handleEyeStyleChange(e.target.value)}>
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="rounded">Rounded</option>
            </select>
          </div>
          <div>
            <label>Module Shape:</label>
            <select value={moduleShape} onChange={(e) => handleModuleShapeChange(e.target.value)}>
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="rounded">Rounded</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCustomizer;