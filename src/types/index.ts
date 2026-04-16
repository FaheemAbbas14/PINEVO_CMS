// Project types
export type ProjectType = 'pin_evo' | 'flex';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
}

// Canvas dimensions (hardware screen constraint)
export const PIN_EVO_CANVAS_WIDTH = 600;
export const PIN_EVO_CANVAS_HEIGHT = 480;

export const FLEX_CANVAS_WIDTH = 480;
export const FLEX_CANVAS_HEIGHT = 800;

export type ComponentType = 'text' | 'text_input' | 'button' | 'image' | 'api' | 'command' | 'audio';

export interface CanvasComponent {
  /** Human-friendly, editable ID for UI and export */
  displayId?: string;
      /** Mode for label: 'static' or 'lang' */
      labelMode?: 'static' | 'lang';
      /** Mode for placeholder: 'static' or 'lang' */
      placeholderMode?: 'static' | 'lang';
    /** Language key for label text (for localization) */
    labelKey?: string;
    /** Language key for placeholder/input text (for localization) */
    placeholderKey?: string;
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  placeholder?: string;  // placeholder text for text_input
  fontSize?: number;
  color?: string;       // text color
  bgColor?: string;     // background color (button/image bg)
  imageUrl?: string;    // image src
  fontWeight?: string;
  /** Font family for text rendering (persisted and exported) */
  fontFamily?: string;
  borderRadius?: number;

  // Button & Interaction Enhancements
  goToScreen?: string;  // ID of the screen to navigate to
  function?: 'none' | 'connect' | 'open_door' | 'initiate_multi_connect' | 'turn_on_modem' | 'dial_up_modem' | 'goto_screen' | 'play_audio' | 'api_call' | 'change_theme' | 'change_language' | 'report_error' | 'retry' | 'reopen' | 'cancel';
  apiCall?: string;     // URL for API trigger
  command?: string;     // Command string to execute
  buttonSound?: string; // Audio URL to play on button click

  // API Component Specifics
  apiUrl?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: string;      // JSON stringified headers
  requestBody?: string;  // JSON stringified body

  // Audio Component Specifics
  audioUrl?: string;     // Audio file URL
}

// Hardware button configuration type
export type HardwareButtonId = 'power' | 'vol_up' | 'vol_down' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | 'star' | 'hash' | 'call' | 'end' | 'left_1' | 'left_2' | 'right_1' | 'right_2' | 'cancel' | 'enter' | 'backspace' | 'speaker' | 'menu';

// Button action types include input collection, device operations, and app interactions
export type HardwareButtonAction = 'text' | 'number' | 'scan' | 'connect' | 'disconnect' | 'start_scanner' | 'change_theme';

export interface HardwareButtonConfig {
  goToScreen?: string;
  inputAction?: HardwareButtonAction;
  command?: string;
}

// Screen hardware button configurations - unique per screen
export type ScreenHardwareButtons = Partial<Record<HardwareButtonId, HardwareButtonConfig>>;

export interface Screen {
  id: string;
  name: string;
  components: CanvasComponent[];
  hardwareButtons?: ScreenHardwareButtons;
}

export interface CMSState {
  project: Project | null;
  screens: Screen[];
  activeScreenId: string;
  selectedComponentId: string | null;
  sandboxMode: boolean;
  previewMode: boolean;
  sandboxConfig: {
    carrier: string;
    servicePoint: string;
    shipmentId: string;
    shipmentType: string;
    allocationType: string;
    expiry: string;
  };
}

export type CMSAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'ADD_SCREEN'; payload: Screen }
  | { type: 'DELETE_SCREEN'; payload: string }
  | { type: 'RENAME_SCREEN'; payload: { id: string; name: string } }
  | { type: 'SET_ACTIVE_SCREEN'; payload: string }
  | { type: 'ADD_COMPONENT'; payload: { screenId: string; component: CanvasComponent } }
  | { type: 'UPDATE_COMPONENT'; payload: { screenId: string; component: CanvasComponent } }
  | { type: 'DELETE_COMPONENT'; payload: { screenId: string; componentId: string } }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'REORDER_COMPONENT'; payload: { screenId: string; componentId: string; x: number; y: number } }
  | { type: 'SET_SANDBOX_MODE'; payload: boolean }
  | { type: 'SET_PREVIEW_MODE'; payload: boolean }
  | { type: 'SET_SCREENS'; payload: Screen[] }
  | { type: 'UPDATE_SANDBOX_CONFIG'; payload: Partial<CMSState['sandboxConfig']> }
  | { type: 'UPDATE_SCREEN_HARDWARE_BUTTON'; payload: { screenId: string; buttonId: HardwareButtonId; config: HardwareButtonConfig } }
  | { type: 'RESET_STATE' };

// Drag types
export const DragTypes = {
  NEW_COMPONENT: 'NEW_COMPONENT',
  EXISTING_COMPONENT: 'EXISTING_COMPONENT',
} as const;

export interface NewComponentDragItem {
  componentType: ComponentType;
}

export interface ExistingComponentDragItem {
  componentId: string;
  startX: number;
  startY: number;
  mouseOffsetX: number;
  mouseOffsetY: number;
}
