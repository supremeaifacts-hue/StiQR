import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from './contexts/AuthContext';

const StatisticsModal = ({ qrCode, onClose }) => {
  const [scanData, setScanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const { isAuthenticated, getToken } = useAuth();

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!qrCode || !qrCode.id) {
        setError('QR code not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/assets/qrcodes/${qrCode.id}/statistics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch statistics: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setStatistics(data.statistics);
          
          // Convert scan history to the format expected by the component
          const formattedScanData = (data.statistics.scanHistory || []).map((scan, index) => ({
            id: index + 1,
            timestamp: scan.timestamp,
            location: `${scan.location.city}, ${scan.location.country}`,
            device: scan.device.type === 'phone' ? 
                    (scan.device.brand === 'Apple' ? 'iPhone' : 'Android Phone') :
                    scan.device.type === 'tablet' ? 
                    (scan.device.brand === 'Apple' ? 'iPad' : 'Android Tablet') :
                    scan.device.type === 'desktop' ? 
                    (scan.device.os.name === 'Windows' ? 'Windows PC' : 
                     scan.device.os.name === 'macOS' ? 'Mac' : 'Desktop') : 
                    'Other Device',
            os: scan.device.os.name,
            browser: scan.device.browser.name
          }));
          
          setScanData(formattedScanData);
        } else {
          setError(data.error || 'Failed to load statistics');
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError(error.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [qrCode, getToken]);

  // Calculate statistics
  const totalScans = scanData.length;
  const scansByHour = Array(24).fill(0);
  const scansByDevice = { 'iPhone': 0, 'Android Phone': 0, 'Windows PC': 0, 'Mac': 0, 'iPad': 0 };
  const scansByLocation = {};
  const scansByOS = { 'iOS': 0, 'Android': 0, 'Windows': 0, 'macOS': 0 };

  scanData.forEach(scan => {
    // Count by hour
    const hour = new Date(scan.timestamp).getHours();
    scansByHour[hour]++;
    
    // Count by device
    scansByDevice[scan.device] = (scansByDevice[scan.device] || 0) + 1;
    
    // Count by location
    scansByLocation[scan.location] = (scansByLocation[scan.location] || 0) + 1;
    
    // Count by OS
    scansByOS[scan.os] = (scansByOS[scan.os] || 0) + 1;
  });

  // Get top locations
  const topLocations = Object.entries(scansByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Get peak hour
  const peakHour = scansByHour.indexOf(Math.max(...scansByHour));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)',
        border: '1px solid rgba(0, 217, 255, 0.3)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#fff',
        fontFamily: '"Inter", "Segoe UI", sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#00D9FF', margin: 0 }}>
            📊 Statistics for "{qrCode?.name || 'QR Code'}"
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px 10px',
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <div>Loading scan statistics...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: '#FF0000' }}>❌</div>
            <div style={{ color: '#FF0000', marginBottom: '20px' }}>{error}</div>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(0, 217, 255, 0.2)',
                border: '1px solid rgba(0, 217, 255, 0.5)',
                borderRadius: '8px',
                color: '#00D9FF',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Close
            </button>
          </div>
        ) : statistics && statistics.message ? (
          // Free tier user - show basic stats only
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: '#00D9FF' }}>🔒</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#fff' }}>
              Basic Statistics
            </div>
            <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '30px' }}>
              {statistics.message}
            </div>
            
            <div style={{
              background: 'rgba(0, 217, 255, 0.1)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '300px',
              margin: '0 auto',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔲</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Total Scans</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#00D9FF' }}>{statistics.totalScans || 0}</div>
            </div>
            
            <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255, 0, 255, 0.1)', borderRadius: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#FF00FF' }}>
                Upgrade to Pro/Ultra for Detailed Analytics
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>
                Get access to:
                <ul style={{ textAlign: 'left', margin: '10px 0 0 20px', padding: 0 }}>
                  <li>Device type breakdown (Phone, Tablet, PC)</li>
                  <li>Location tracking (city, country)</li>
                  <li>Time of day analysis</li>
                  <li>Browser and OS detection</li>
                  <li>Historical scan data</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  onClose();
                  // In a real app, this would navigate to pricing page
                  window.location.href = '/pricing';
                }}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #FF00FF 0%, #00D9FF 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                View Pricing Plans
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              <div style={{
                background: 'rgba(0, 217, 255, 0.1)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔲</div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Total Scans</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalScans}</div>
              </div>

              <div style={{
                background: 'rgba(255, 0, 255, 0.1)',
                border: '1px solid rgba(255, 0, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📍</div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Unique Locations</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{Object.keys(scansByLocation).length}</div>
              </div>

              <div style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📱</div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Device Types</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{Object.keys(scansByDevice).length}</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 0, 0.1)',
                border: '1px solid rgba(255, 255, 0, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏰</div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Peak Hour</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{peakHour}:00</div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {/* Device Distribution */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#FF00FF' }}>
                  📱 Device Distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(scansByDevice).map(([device, count]) => {
                    const percentage = totalScans > 0 ? Math.round((count / totalScans) * 100) : 0;
                    return (
                      <div key={device} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px' }}>{device}</span>
                          <span style={{ fontSize: '12px', color: '#00D9FF' }}>{count} ({percentage}%)</span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #FF00FF, #00D9FF)',
                            borderRadius: '3px',
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Distribution */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#00FF00' }}>
                  ⏰ Scan Times (24h)
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {scansByHour.map((count, hour) => {
                    const maxScans = Math.max(...scansByHour);
                    const height = maxScans > 0 ? (count / maxScans) * 40 : 0;
                    return (
                      <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30px' }}>
                        <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>{hour}</div>
                        <div
                          style={{
                            width: '12px',
                            height: `${height}px`,
                            background: count > 0 ? 'linear-gradient(to top, #00FF00, #00D9FF)' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '2px',
                            transition: 'height 0.3s ease',
                          }}
                          title={`${hour}:00 - ${count} scans`}
                        ></div>
                        <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Locations */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#00D9FF' }}>
                🌍 Top Locations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topLocations.map(([location, count], index) => {
                  const percentage = totalScans > 0 ? Math.round((count / totalScans) * 100) : 0;
                  return (
                    <div key={location} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        background: 'rgba(0, 217, 255, 0.2)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#00D9FF',
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px' }}>{location}</span>
                          <span style={{ fontSize: '14px', color: '#FF00FF' }}>{count} scans ({percentage}%)</span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00D9FF, #FF00FF)',
                            borderRadius: '3px',
                          }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>

            {/* Recent Scans Table */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#FFFF00' }}>
                📋 Recent Scan Activity
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>Location</th>
                      <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>Device</th>
                      <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>OS/Browser</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanData.slice(0, 5).map((scan) => {
                      const date = new Date(scan.timestamp);
                      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dateString = date.toLocaleDateString();
                      
                      return (
                        <tr key={scan.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '10px', fontSize: '12px' }}>
                            <div>{dateString}</div>
                            <div style={{ color: '#888', fontSize: '11px' }}>{timeString}</div>
                          </td>
                          <td style={{ padding: '10px', fontSize: '12px' }}>{scan.location}</td>
                          <td style={{ padding: '10px', fontSize: '12px' }}>{scan.device}</td>
                          <td style={{ padding: '10px', fontSize: '12px' }}>
                            <div>{scan.os}</div>
                            <div style={{ color: '#888', fontSize: '11px' }}>{scan.browser}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note about scan tracking */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(0, 217, 255, 0.1)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#00D9FF',
            }}>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>ℹ️ How Scan Tracking Works:</div>
              <div>
                When someone scans your QR code:
                <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                  <li>1. User scans QR code → Opens tracking URL (e.g., https://yourapp.com/track/abc123)</li>
                  <li>2. Server records: timestamp, device info, location from IP, user agent</li>
                  <li>3. Server instantly redirects to your destination URL</li>
                  <li>4. User sees the intended content (no noticeable delay)</li>
                  <li>5. Analytics data is stored for your Pro/Ultra plan</li>
                </ul>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#aaa' }}>
                  Location data is estimated from IP address. Device detection uses user agent parsing.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsModal;
