import { useState } from 'react';
import './PINSimulator.css';

interface PINSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PINSimulator({ isOpen, onClose }: PINSimulatorProps) {
  const [city, setCity] = useState('New York');
  const [zipCode, setZipCode] = useState('10001');
  const [radiusKm, setRadiusKm] = useState(50);
  const [globalDevices, setGlobalDevices] = useState(50000);
  const [localDevices, setLocalDevices] = useState(800);
  const [pinLength, setPinLength] = useState(8);
  const [pinsPerDevice, setPinsPerDevice] = useState(1);

  // Calculate total pool based on PIN length (10^n for n-digit PIN)
  const totalPool = Math.pow(10, pinLength);

  if (!isOpen) return null;

  // Calculate total PIN slots being used across all local devices
  // Each device can store multiple PINs, increasing collision risk
  const totalLocalPinSlots = localDevices * pinsPerDevice;


  // Calculate collision probability (Birthday paradox approx)
  // P(collision) = 1 - e^(-n^2 / 2m) where n = totalLocalPinSlots, m = totalPool
  // More pins per device = higher collision probability
  const exponent = -Math.pow(totalLocalPinSlots, 2) / (2 * totalPool);
  const collisionProb = 1 - Math.exp(exponent);

  // Safe reuse factor: how many times can local demand fit into global pool
  // Higher pins per device means we need more unique PINs
  const safeReuseFactor = Math.floor(totalPool / totalLocalPinSlots);

  // Calculate device density based on radius (devices per 1000 sq km)
  // This updates localDevices when radius changes to simulate realistic scenarios
  const updateLocalDevicesFromRadius = (newRadius: number) => {
    // Base density: 800 devices at 50km radius
    // As radius changes, recalculate to maintain realistic density
    const baseRadius = 50;
    const baseDevices = 800;
    // Density = devices / area (π * r²)
    // At 50km: density = 800 / (π * 50²) ≈ 0.102 devices/km²
    // Scale proportionally with radius squared
    const areaRatio = (newRadius * newRadius) / (baseRadius * baseRadius);
    const newLocalDevices = Math.round(baseDevices * areaRatio);
    setLocalDevices(Math.max(10, Math.min(10000, newLocalDevices)));
  };

  return (
    <div className="pin-simulator-overlay">
      <div className="pin-simulator-modal glass-effect">
        <div className="simulator-header">
          <div className="header-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="title-icon">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <h2>Location-Based PIN Reuse Simulator</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="simulator-body">
          <div className="simulator-controls">
            <h3>Configuration</h3>
            <div className="control-group">
              <div className="input-group">
                <label>Target City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New York" />
              </div>
              <div className="input-group">
                <label>Zip Code</label>
                <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="e.g. 10001" />
              </div>
            </div>

            <div className="input-group slider-group">
              <label>Safe Partition Radius <span className="highlight-text">{radiusKm} KM</span></label>
              <input type="range" min="10" max="500" value={radiusKm} onChange={e => {
                const newRadius = Number(e.target.value);
                setRadiusKm(newRadius);
                updateLocalDevicesFromRadius(newRadius);
              }} className="styled-slider" />
              <div className="slider-labels">
                <span>10 KM</span>
                <span>500 KM</span>
              </div>
            </div>

            <div className="control-group">
              <div className="input-group">
                <label>Global Devices</label>
                <div className="number-input-wrap">
                  <input type="number" min="1000" max="1000000" step="1000" value={globalDevices} onChange={e => setGlobalDevices(Number(e.target.value))} />
                </div>
              </div>
              <div className="input-group">
                <label>Local Devices (in radius)</label>
                <div className="number-input-wrap">
                  <input type="number" min="10" max="10000" step="10" value={localDevices} onChange={e => setLocalDevices(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="input-group slider-group">
              <label>PIN Length <span className="highlight-text">{pinLength} digits</span></label>
              <input type="range" min="4" max="10" value={pinLength} onChange={e => setPinLength(Number(e.target.value))} className="styled-slider" />
              <div className="slider-labels">
                <span>4</span>
                <span>10</span>
              </div>
            </div>

            <div className="input-group slider-group">
              <label>PINs per Hardware <span className="highlight-text">{pinsPerDevice} PIN{pinsPerDevice > 1 ? 's' : ''}</span></label>
              <input type="range" min="1" max="100" value={pinsPerDevice} onChange={e => setPinsPerDevice(Number(e.target.value))} className="styled-slider" />
              <div className="slider-labels">
                <span>1</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div className="simulator-results">
            <h3>Security & Scale Analysis</h3>
            <div className="result-cards">
              <div className="result-card">
                <div className="card-icon pool-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h4>Global Pool Size</h4>
                <div className="value gradient-text">
                  {totalPool >= 1e9 ? `${(totalPool / 1e9).toFixed(0)}B` : totalPool >= 1e6 ? `${(totalPool / 1e6).toFixed(0)}M` : totalPool >= 1e3 ? `${(totalPool / 1e3).toFixed(0)}K` : totalPool}
                </div>
                <div className="sub-value">Max unique {pinLength}-digit PINs</div>
              </div>

              <div className="result-card highlight-card">
                <div className="card-icon risk-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h4>Local Collision Risk</h4>
                <div className="value">{(collisionProb * 100).toFixed(5)}%</div>
                <div className="sub-value">{localDevices} devices × {pinsPerDevice} PINs = {totalLocalPinSlots} slots</div>
              </div>

              <div className="result-card">
                <div className="card-icon scale-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h4>Safe Reuse Factor</h4>
                <div className="value gradient-text">{safeReuseFactor >= 1e9 ? `${(safeReuseFactor / 1e9).toFixed(1)}B` : safeReuseFactor >= 1e6 ? `${(safeReuseFactor / 1e6).toFixed(1)}M` : safeReuseFactor >= 1e3 ? `${(safeReuseFactor / 1e3).toFixed(1)}K` : safeReuseFactor}x</div>
                <div className="sub-value">Pool / Local slots ({totalPool >= 1e6 ? `${(totalPool / 1e6).toFixed(0)}M` : totalPool} / {totalLocalPinSlots})</div>
              </div>
            </div>

            <div className="visual-demo">
              <h4>Geographic PIN Separation (<span className="highlight-text">{radiusKm} KM</span> Boundary)</h4>
              <div className="map-visualization">
                <div className="location-node active pulse">
                  <div className="pin-badge">8493-1206</div>
                  <div className="loc-name">{city} ({zipCode})</div>
                  <div className="loc-status">Active Request</div>
                </div>

                <div className="distance-connector">
                  <div className="distance-line">
                    <div className="animated-dot"></div>
                  </div>
                  <span className="distance-label">&gt; {radiusKm} KM apart</span>
                </div>

                <div className="location-node reused">
                  <div className="pin-badge">8493-1206</div>
                  <div className="loc-name">Distant Region</div>
                  <div className="loc-status safe">Safely Reused</div>
                </div>
              </div>
              <p className="demo-desc">
                The CMS provisions PIN <strong className="highlight-text">8493-1206</strong> for a user in {city}. Because the nearest hardware device currently using the same PIN is over {radiusKm} kilometers away, cross-usage attacks are practically impossible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
