import React from 'react';
import EditorPage from './EditorPage';
import TopBar from './TopBar';

const LandingPage = ({ onViewDashboard, onViewPricing, qrCodeToEdit, onClearQrCodeToEdit }) => {

  const handlePricingClick = () => {
    if (onViewPricing) {
      onViewPricing();
    } else {
      console.log('Pricing clicked');
    }
  };

  const handleSignUpClick = () => {
    console.log('Sign Up clicked');
  };

  const handleLoginClick = () => {
    console.log('Login clicked');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)',
      color: '#fff',
      padding: '0',
      margin: '0',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      overflow: 'hidden',
    }}>
      <TopBar 
        onViewDashboard={onViewDashboard}
        onViewPricing={handlePricingClick}
        onSignUp={handleSignUpClick}
        onLogin={handleLoginClick}
        onGoToLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Hero Section */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 20px 120px',
      }}>
        {/* Subtitle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          padding: '10px 20px',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          borderRadius: '30px',
          color: '#00D9FF',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          <span style={{ fontSize: '16px' }}>✨</span>
          Next-Gen QR Code Generator
        </div>

        {/* Main Heading */}
        <h1 style={{
          fontSize: '56px',
          fontWeight: '900',
          lineHeight: '1.1',
          margin: '0 0 18px 0',
          letterSpacing: '-1px',
        }}>
          <span style={{ color: '#FF00FF', textShadow: '0 0 24px rgba(255, 0, 255, 0.5)' }}>
            Create QR Codes 
          </span>
          <span style={{ color: '#ffffff' }}> That Pop</span>
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '18px',
          lineHeight: '1.6',
          color: '#a0a0a0',
          maxWidth: '700px',
          marginBottom: '10px',
        }}>
          Generate fully customized QR codes with{' '}
          <span style={{ color: '#00D9FF' }}>stunning stickers</span>, vibrant colors, and advanced features for your brand.
        </p>

        <div style={{ width: '100%', maxWidth: '1200px', marginTop: '10px' }}>
          <EditorPage embedded qrCodeToEdit={qrCodeToEdit} onClearQrCodeToEdit={onClearQrCodeToEdit} />
        </div>

        {/* Frame #2 Showcase */}
        <div style={{
          marginTop: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0',
            textAlign: 'center',
          }}>
            Professional QR Frame Examples
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#a0a0a0',
            maxWidth: '600px',
            textAlign: 'center',
            margin: '0 0 20px 0',
            lineHeight: '1.5',
          }}>
            Choose from beautifully designed frames to make your QR codes stand out
          </p>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '30px',
            maxWidth: '800px',
          }}>
            {/* Frame #2 Example */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px',
            }}>
              <div style={{
                width: '200px',
                backgroundColor: '#000000',
                borderRadius: '14px',
                padding: '14px 14px 10px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                boxSizing: 'border-box',
              }}>
                {/* QR Code Tile */}
                <div style={{
                  width: '172px',
                  height: '172px',
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}>
                  {/* Sample QR pattern */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: 'repeat(7, 1fr)',
                    gap: '2px',
                    padding: '10px',
                  }}>
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} style={{
                        backgroundColor: Math.random() > 0.5 ? '#000000' : 'transparent',
                        borderRadius: '1px',
                      }} />
                    ))}
                  </div>
                </div>
                
                {/* Label */}
                <div style={{
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  paddingBottom: '2px',
                  userSelect: 'none',
                }}>
                  SCAN ME
                </div>
              </div>
              
              <div style={{
                fontSize: '14px',
                color: '#00D9FF',
                fontWeight: '600',
                textAlign: 'center',
              }}>
                Frame #2 - Professional Black
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;