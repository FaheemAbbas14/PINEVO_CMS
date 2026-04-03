import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CMSState, CMSAction, Screen, CanvasComponent, Project, HardwareButtonId, HardwareButtonConfig } from '../types';
import { generateHtmlExport, generateJsonScreensExport } from '../services/exportService';

// Local storage keys
const STORAGE_KEY = 'pinevo_cms_state';

// Load initial state from localStorage
function loadInitialState(): CMSState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that we have the required fields and project exists
      if (parsed.screens && parsed.screens.length > 0 && parsed.project) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }

  // Return default state if nothing saved
  return getDefaultState();
}

const initialState: CMSState = loadInitialState();

function downloadFile(content: Blob | string, mimeType: string, fileName: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Helper to create default state
function getDefaultState(): CMSState {
  const initialScreen: Screen = {
    id: uuidv4(),
    name: 'Screen 1',
    components: [],
  };

  return {
    project: null,
    screens: [initialScreen],
    activeScreenId: initialScreen.id,
    selectedComponentId: null,
    sandboxMode: false,
    previewMode: false,
    sandboxConfig: {
      carrier: '',
      servicePoint: '',
      shipmentId: '',
      shipmentType: '',
      allocationType: '',
      expiry: '',
    },
  };
}

function cmsReducer(state: CMSState, action: CMSAction): CMSState {
  switch (action.type) {
    case 'SET_PROJECT': {
      // If project already exists, don't reset screens
      if (state.project) {
        return { ...state, project: action.payload };
      }
      // Only create new screen for first project setup
      const newScreen: Screen = {
        id: uuidv4(),
        name: 'Screen 1',
        components: [],
      };
      return {
        ...state,
        project: action.payload,
        screens: [newScreen],
        activeScreenId: newScreen.id,
        selectedComponentId: null,
      };
    }

    case 'ADD_SCREEN':
      return { ...state, screens: [...state.screens, action.payload], activeScreenId: action.payload.id };

    case 'DELETE_SCREEN': {
      if (state.screens.length <= 1) return state;
      const remaining = state.screens.filter((s) => s.id !== action.payload);
      const newActive = state.activeScreenId === action.payload ? remaining[remaining.length - 1].id : state.activeScreenId;
      return { ...state, screens: remaining, activeScreenId: newActive, selectedComponentId: null };
    }

    case 'RENAME_SCREEN':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.id ? { ...s, name: action.payload.name } : s
        ),
      };

    case 'SET_ACTIVE_SCREEN':
      return { ...state, activeScreenId: action.payload, selectedComponentId: null };

    case 'ADD_COMPONENT':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.screenId
            ? { ...s, components: [...s.components, action.payload.component] }
            : s
        ),
        selectedComponentId: action.payload.component.id,
      };

    case 'UPDATE_COMPONENT':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.screenId
            ? {
              ...s,
              components: s.components.map((c) =>
                c.id === action.payload.component.id ? action.payload.component : c
              ),
            }
            : s
        ),
      };

    case 'DELETE_COMPONENT':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.screenId
            ? { ...s, components: s.components.filter((c) => c.id !== action.payload.componentId) }
            : s
        ),
        selectedComponentId:
          state.selectedComponentId === action.payload.componentId ? null : state.selectedComponentId,
      };

    case 'SELECT_COMPONENT':
      return { ...state, selectedComponentId: action.payload };

    case 'REORDER_COMPONENT':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.screenId
            ? {
              ...s,
              components: s.components.map((c) =>
                c.id === action.payload.componentId ? { ...c, x: action.payload.x, y: action.payload.y } : c
              ),
            }
            : s
        ),
      };

    case 'SET_SANDBOX_MODE':
      return { ...state, sandboxMode: action.payload };

    case 'SET_PREVIEW_MODE':
      return { ...state, previewMode: action.payload };

    case 'SET_SCREENS':
      return { ...state, screens: action.payload };

    case 'UPDATE_SANDBOX_CONFIG':
      return { ...state, sandboxConfig: { ...state.sandboxConfig, ...action.payload } };

    case 'UPDATE_SCREEN_HARDWARE_BUTTON':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.screenId
            ? {
              ...s,
              hardwareButtons: {
                ...s.hardwareButtons,
                [action.payload.buttonId]: action.payload.config,
              },
            }
            : s
        ),
      };

    case 'RESET_STATE':
      return getDefaultState();

    default:
      return state;
  }
}

interface CMSContextValue {
  state: CMSState;
  activeScreen: Screen | undefined;
  selectedComponent: CanvasComponent | undefined;
  setProject: (project: { name: string; type: 'pin_evo' | 'flex' }) => void;
  addScreen: () => void;
  deleteScreen: (id: string) => void;
  renameScreen: (id: string, name: string) => void;
  setActiveScreen: (id: string) => void;
  addComponent: (component: CanvasComponent) => void;
  updateComponent: (component: CanvasComponent) => void;
  deleteComponent: (componentId: string) => void;
  selectComponent: (id: string | null) => void;
  moveComponent: (componentId: string, x: number, y: number) => void;
  saveScreens: () => Promise<void>;
  saveAsHtml: () => Promise<void>;
  saveProject: () => Promise<void>;
  loadProject: () => void;
  setSandboxMode: (enabled: boolean) => void;
  setPreviewMode: (enabled: boolean) => void;
  updateSandboxConfig: (config: Partial<CMSState['sandboxConfig']>) => void;
  resetSandboxConfig: () => void;
  updateScreenHardwareButton: (screenId: string, buttonId: HardwareButtonId, config: HardwareButtonConfig) => void;
  clearSession: () => void;
}

const CMSContext = createContext<CMSContextValue | null>(null);

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cmsReducer, initialState);
  const currentProjectFileHandleRef = useRef<FileSystemFileHandle | null>(null);

  const activeScreen = state.screens.find((s) => s.id === state.activeScreenId);
  const selectedComponent = activeScreen?.components.find((c) => c.id === state.selectedComponentId);

  const setProject = useCallback((project: { name: string; type: 'pin_evo' | 'flex' }) => {
    const newProject: Project = {
      id: uuidv4(),
      name: project.name,
      type: project.type,
    };
    dispatch({ type: 'SET_PROJECT', payload: newProject });
  }, []);

  const addScreen = useCallback(() => {
    const newScreen: Screen = {
      id: uuidv4(),
      name: `Screen ${state.screens.length + 1}`,
      components: [],
    };
    dispatch({ type: 'ADD_SCREEN', payload: newScreen });
  }, [state.screens.length]);

  const deleteScreen = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCREEN', payload: id });
  }, []);

  const renameScreen = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME_SCREEN', payload: { id, name } });
  }, []);

  const setActiveScreen = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_SCREEN', payload: id });
  }, []);

  const addComponent = useCallback(
    (component: CanvasComponent) => {
      dispatch({ type: 'ADD_COMPONENT', payload: { screenId: state.activeScreenId, component } });
    },
    [state.activeScreenId]
  );

  const updateComponent = useCallback(
    (component: CanvasComponent) => {
      dispatch({ type: 'UPDATE_COMPONENT', payload: { screenId: state.activeScreenId, component } });
    },
    [state.activeScreenId]
  );

  const deleteComponent = useCallback(
    (componentId: string) => {
      dispatch({ type: 'DELETE_COMPONENT', payload: { screenId: state.activeScreenId, componentId } });
    },
    [state.activeScreenId]
  );

  const selectComponent = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: id });
  }, []);

  const moveComponent = useCallback(
    (componentId: string, x: number, y: number) => {
      dispatch({ type: 'REORDER_COMPONENT', payload: { screenId: state.activeScreenId, componentId, x, y } });
    },
    [state.activeScreenId]
  );

  const saveScreens = useCallback(async () => {
    const jsonBundle = await generateJsonScreensExport(state);
    downloadFile(jsonBundle.blob, 'application/zip', jsonBundle.fileName);
  }, [state]);

  const saveAsHtml = useCallback(async () => {
    const htmlBundle = await generateHtmlExport(state);
    downloadFile(htmlBundle.blob, 'application/zip', htmlBundle.fileName);
  }, [state]);

  const saveProject = useCallback(async () => {
    if (!state.project) {
      alert('No project to save. Please create or open a project first.');
      return;
    }

    const projectData = {
      project: state.project,
      screens: state.screens,
      activeScreenId: state.activeScreenId,
      sandboxConfig: state.sandboxConfig,
    };

    const json = JSON.stringify(projectData, null, 2);
    const pickerWindow = window as any;

    try {
      if (typeof pickerWindow.showSaveFilePicker === 'function') {
        let handle = currentProjectFileHandleRef.current;

        if (!handle) {
          handle = await pickerWindow.showSaveFilePicker({
            suggestedName: `${state.project.name.replace(/\s+/g, '_')}_project.json`,
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            }],
          });
          currentProjectFileHandleRef.current = handle;
        }

        if (!handle) {
          return;
        }

        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.warn('Save picker failed, falling back to download:', err);
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.project.name.replace(/\s+/g, '_')}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.project, state.screens, state.activeScreenId, state.sandboxConfig]);

  const loadProject = useCallback(() => {
    const pickerWindow = window as any;

    if (typeof pickerWindow.showOpenFilePicker === 'function') {
      void (async () => {
        try {
          const [handle] = await pickerWindow.showOpenFilePicker({
            multiple: false,
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            }],
          });

          if (!handle) return;

          const file = await handle.getFile();
          const text = await file.text();
          const projectData = JSON.parse(text);
          const importedState = projectData.state || projectData;

          if (!importedState.project || !importedState.screens) {
            alert('Invalid project file. Please select a valid PINEVO project file.');
            return;
          }

          currentProjectFileHandleRef.current = handle;
          dispatch({ type: 'SET_PROJECT', payload: importedState.project });
          dispatch({ type: 'SET_SCREENS', payload: importedState.screens });
          dispatch({ type: 'SET_ACTIVE_SCREEN', payload: importedState.activeScreenId || importedState.screens[0]?.id });
          dispatch({ type: 'UPDATE_SANDBOX_CONFIG', payload: importedState.sandboxConfig || {} });
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            return;
          }
          console.error('Error loading project:', err);
          alert('Failed to load project. Please select a valid PINEVO project file.');
        }
      })();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const projectData = JSON.parse(text);
        const importedState = projectData.state || projectData;

        if (!importedState.project || !importedState.screens) {
          alert('Invalid project file. Please select a valid PINEVO project file.');
          return;
        }

        currentProjectFileHandleRef.current = null;
        // Load the project data
        dispatch({ type: 'SET_PROJECT', payload: importedState.project });
        dispatch({ type: 'SET_SCREENS', payload: importedState.screens });
        dispatch({ type: 'SET_ACTIVE_SCREEN', payload: importedState.activeScreenId || importedState.screens[0]?.id });
        dispatch({ type: 'UPDATE_SANDBOX_CONFIG', payload: importedState.sandboxConfig || {} });
      } catch (err) {
        console.error('Error loading project:', err);
        alert('Failed to load project. Please select a valid PINEVO project file.');
      }
    };
    input.click();
  }, []);

  const setSandboxMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_SANDBOX_MODE', payload: enabled });
  }, []);

  const setPreviewMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_PREVIEW_MODE', payload: enabled });
  }, []);

  const updateSandboxConfig = useCallback((config: Partial<CMSState['sandboxConfig']>) => {
    dispatch({ type: 'UPDATE_SANDBOX_CONFIG', payload: config });
  }, []);

  const resetSandboxConfig = useCallback(() => {
    dispatch({
      type: 'UPDATE_SANDBOX_CONFIG', payload: {
        carrier: '',
        servicePoint: '',
        shipmentId: '',
        shipmentType: '',
        allocationType: '',
        expiry: '',
      }
    });
  }, []);

  const updateScreenHardwareButton = useCallback((screenId: string, buttonId: HardwareButtonId, config: HardwareButtonConfig) => {
    dispatch({ type: 'UPDATE_SCREEN_HARDWARE_BUTTON', payload: { screenId, buttonId, config } });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    currentProjectFileHandleRef.current = null;
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [state]);

  return (
    <CMSContext.Provider
      value={{
        state,
        activeScreen,
        selectedComponent,
        setProject,
        addScreen,
        deleteScreen,
        renameScreen,
        setActiveScreen,
        addComponent,
        updateComponent,
        deleteComponent,
        selectComponent,
        moveComponent,
        saveScreens,
        saveAsHtml,
        saveProject,
        loadProject,
        setSandboxMode,
        setPreviewMode,
        updateSandboxConfig,
        resetSandboxConfig,
        updateScreenHardwareButton,
        clearSession,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error('useCMS must be used inside CMSProvider');
  return ctx;
}
