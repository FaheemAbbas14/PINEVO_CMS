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
  {
    value: 'change_theme',
    label: 'Change Theme',
    description: 'Switch application theme',
    type: 'device',
  },
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
