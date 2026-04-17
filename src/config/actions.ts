/**
 * Centralized actions configuration for hardware buttons and device interactions.
 * This can be easily populated from a server endpoint in the future.
 */

export type ActionType = 'device';

export interface ActionDefinition {
  value: string;
  label: string;
  description?: string;
  type: ActionType;
  icon?: string;
}

// ============================================================================
// Device Actions - for hardware device operations
// ============================================================================

export const DEVICE_ACTIONS: ActionDefinition[] = [
  { value: 'toggle_language', label: 'Toggle Language', description: 'Toggle application language', type: 'device' },
  { value: 'connect', label: 'Connect Device', description: 'Establish connection with BLE/device', type: 'device' },
  { value: 'disconnect', label: 'Disconnect Device', description: 'Disconnect from BLE/device', type: 'device' },
  { value: 'changetheme', label: 'Change Theme (Legacy)', description: 'Switch application theme (legacy)', type: 'device' },
  { value: 'change_theme', label: 'Change Theme', description: 'Switch application theme', type: 'device' },
  { value: 'change_language', label: 'Change Language', description: 'Switch application language', type: 'device' },
  { value: 'startscanner', label: 'Start Scanner', description: 'Start the hardware scanner (legacy)', type: 'device' },
  { value: 'stopscanner', label: 'Stop Scanner', description: 'Stop the hardware scanner (legacy)', type: 'device' },
  { value: 'bleProcessStart', label: 'BLE Process Start', description: 'Start BLE process', type: 'device' },
  { value: 'bleProcessEnd', label: 'BLE Process End', description: 'End BLE process', type: 'device' },
  { value: 'openDoor', label: 'Open Door', description: 'Open the device door', type: 'device' },
  { value: 'modemOn', label: 'Modem On', description: 'Turn modem on', type: 'device' },
  { value: 'modemOff', label: 'Modem Off', description: 'Turn modem off', type: 'device' },
  { value: 'courierLogin', label: 'Courier Login', description: 'Courier login', type: 'device' },
  { value: 'searchParcel', label: 'Search Parcel', description: 'Search for a parcel', type: 'device' },
  { value: 'getCapacity', label: 'Get Capacity', description: 'Get device capacity', type: 'device' },
  { value: 'changeSize', label: 'Change Size', description: 'Change device size', type: 'device' },
  { value: 'storeCacheData', label: 'Store Cache Data', description: 'Store cache data', type: 'device' },
  { value: 'navigate', label: 'Navigate', description: 'Navigate to screen', type: 'device' },
  { value: 'screenTimeOut', label: 'Screen Timeout', description: 'Screen timeout', type: 'device' },
  { value: 'Unload', label: 'Unload', description: 'Unload event', type: 'device' },
  { value: 'onUnload', label: 'On Unload', description: 'On unload event', type: 'device' },
  { value: 'playSound', label: 'Play Sound', description: 'Play a sound', type: 'device' },
  { value: 'start_scan', label: 'Start Scan', description: 'Start scan', type: 'device' },
  { value: 'stop_scan', label: 'Stop Scan', description: 'Stop scan', type: 'device' },
  { value: 'connect_using_uid', label: 'Connect Using UID', description: 'Connect using UID', type: 'device' },
  { value: 'is_connected', label: 'Is Connected', description: 'Check if device is connected', type: 'device' },
];

// ============================================================================
// Combined Actions - all available actions
// ============================================================================

export const ALL_ACTIONS: ActionDefinition[] = [
  ...DEVICE_ACTIONS,
];

// ============================================================================
// Utility Functions
// ============================================================================

export function getActionLabel(value: string): string {
  const action = ALL_ACTIONS.find((a) => a.value === value);
  return action?.label || value;
}

export function getActionsByType(type: ActionType): ActionDefinition[] {
  return ALL_ACTIONS.filter((a) => a.type === type);
}

export function isValidAction(value: string): boolean {
  return ALL_ACTIONS.some((a) => a.value === value);
}
