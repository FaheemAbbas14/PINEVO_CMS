/**
 * Centralized actions configuration for hardware buttons and device interactions.
 * This can be easily populated from a server endpoint in the future.
 */

export type ActionType = 'input' | 'device' | 'app';

export interface ActionDefinition {
  value: string;
  label: string;
  description?: string;
  type: ActionType;
  icon?: string;
}

// ============================================================================
// Input Actions - for hardware button input handling
// ============================================================================

export const INPUT_ACTIONS: ActionDefinition[] = [
  {
    value: 'text',
    label: 'Text Input',
    description: 'Capture text from hardware button input',
    type: 'input',
  },
  {
    value: 'number',
    label: 'Number Input',
    description: 'Capture numeric input from hardware button',
    type: 'input',
  },
  {
    value: 'scan',
    label: 'QR/NFC Scan',
    description: 'Trigger QR code or NFC scan',
    type: 'input',
  },
];

// ============================================================================
// Device Actions - for hardware device operations
// ============================================================================

export const DEVICE_ACTIONS: ActionDefinition[] = [
  {
    value: 'connect',
    label: 'Connect Device',
    description: 'Establish connection with BLE/device',
    type: 'device',
  },
  {
    value: 'disconnect',
    label: 'Disconnect Device',
    description: 'Disconnect from BLE/device',
    type: 'device',
  },
  {
    value: 'start_scanner',
    label: 'Start Scanner',
    description: 'Start the hardware scanner',
    type: 'device',
  },
];

// ============================================================================
// App Actions - for application-level operations
// ============================================================================

export const APP_ACTIONS: ActionDefinition[] = [
  {
    value: 'change_theme',
    label: 'Change Theme',
    description: 'Switch application theme',
    type: 'app',
  },
];

// ============================================================================
// Combined Actions - all available actions
// ============================================================================

export const ALL_ACTIONS: ActionDefinition[] = [
  ...INPUT_ACTIONS,
  ...DEVICE_ACTIONS,
  ...APP_ACTIONS,
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
