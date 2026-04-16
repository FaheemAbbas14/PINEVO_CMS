// Generic firmware event handler for web-based CMS UI
// Handles JSON messages from firmware, dispatches to registered handlers, and updates the UI

// Registry of event handlers by type
type FirmwareEventHandler = (payload: any) => void;


const firmwareEventRegistry: { [type: string]: FirmwareEventHandler } = {
  barcode_scanned: (payload: any) => {
    displayFirmwareMessage('Barcode: ' + payload.barcode, 'info');
  },
  error: (payload: any) => {
    displayFirmwareMessage('Error: ' + (payload.message || JSON.stringify(payload)), 'error');
  },
  info: (payload: any) => {
    displayFirmwareMessage(payload.message || JSON.stringify(payload), 'info');
  },
  warning: (payload: any) => {
    displayFirmwareMessage(payload.message || JSON.stringify(payload), 'warning');
  },
  // Add more event types here as needed
};

// Main handler function
export function handleFirmwareEvent(rawMessage: any) {
  let msg: any;
  try {
    msg = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
  } catch {
    displayFirmwareMessage('Malformed message: ' + String(rawMessage), 'error');
    return;
  }
  if (!msg || typeof msg.type !== 'string' || msg.payload === undefined) {
    displayFirmwareMessage('Malformed message: ' + JSON.stringify(msg), 'error');
    return;
  }
  const handler: any = firmwareEventRegistry[msg.type];
  if (handler) {
    handler(msg.payload);
  } else {
    displayFirmwareMessage('Unknown event type: ' + msg.type, 'warning');
  }
}

// Display message on the active screen
function displayFirmwareMessage(message: any, type: string = 'info') {
  const el = document.getElementById('firmware-message');
  if (!el) return;
  el.textContent = message;
  el.className = '';
  el.classList.add('firmware-message', type);
}



export function registerFirmwareEvent(type: any, handler: any) {
  firmwareEventRegistry[type] = handler;
}

// Example CSS (add to your stylesheet):
// .firmware-message { padding: 8px; border-radius: 4px; margin: 8px 0; }
// .firmware-message.info { background: #e0f7fa; color: #006064; }
// .firmware-message.error { background: #ffebee; color: #c62828; }
// .firmware-message.warning { background: #fff8e1; color: #ff8f00; }
