import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CMSState, CMSAction, Screen, CanvasComponent, Project, HardwareButtonId, HardwareButtonConfig } from '../types';
import type { DeployUIType } from '../services/exportService';
import { FEATURE_FLAGS } from '../config/project';
import { generateHtmlExport, generateJsonScreensExport } from '../services/exportService';
import {
  getAllPersistedLanguages,
  replaceAllPersistedLanguages,
} from '../locales/persistLanguage';

// IndexedDB keys for file-handle persistence only
const HANDLE_DB_NAME = 'pinevo_cms_file_handles';
const HANDLE_STORE_NAME = 'handles';
const HANDLE_KEY = 'current_project_file_handle';

function getHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePersistedProjectFileHandle(handle: FileSystemFileHandle | null): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await getHandleDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(HANDLE_STORE_NAME);
      if (handle) {
        store.put(handle, HANDLE_KEY);
      } else {
        store.delete(HANDLE_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Failed to persist project file handle:', err);
  }
}

async function loadPersistedProjectFileHandle(): Promise<FileSystemFileHandle | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await getHandleDb();
    const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE_NAME, 'readonly');
      const store = tx.objectStore(HANDLE_STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch (err) {
    console.warn('Failed to load persisted project file handle:', err);
    return null;
  }
}

// Load initial state from defaults only. Project data should come from an opened JSON file.
function loadInitialState(): CMSState {
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
  const initialScreenId = uuidv4();
  const initialComponentId = uuidv4();
  const initialScreen: Screen = {
    id: initialScreenId,
    name: 'Screen 1',
    components: [
      {
        id: initialComponentId,
        type: 'text_input',
        x: 100,
        y: 100,
        width: 260,
        height: 60,
        labelKey: 'pickup',
        placeholderKey: 'pickup',
        fontSize: 16,
        color: '#222',
        bgColor: '#fff',
        borderRadius: 8
      }
    ],
  };

  return {
    project: null,
    screens: [initialScreen],
    activeScreenId: initialScreenId,
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

    case 'UPDATE_PROJECT':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          ...action.payload,
        },
      };

    case 'ADD_SCREEN':
      return { ...state, screens: [...state.screens, action.payload], activeScreenId: action.payload.id };

    case 'UPDATE_SCREEN':
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === action.payload.id
            ? { ...s, ...action.payload.patch }
            : s
        ),
      };

    case 'DELETE_SCREEN': {
      if (state.screens.length <= 1) return state;
      const remaining = state.screens.filter((s) => s.id !== action.payload);
      const lastScreen = remaining.at(-1);
      const newActive = state.activeScreenId === action.payload ? (lastScreen ? lastScreen.id : state.activeScreenId) : state.activeScreenId;
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
      {
      let addedComponentId = action.payload.component.id;
      return {
        ...state,
        screens: state.screens.map((s) => {
          if (s.id !== action.payload.screenId) {
            return s;
          }

          const existingIds = new Set(s.components.map((c) => c.id));
          const existingDisplayIds = new Set(
            s.components
              .map((c) => c.displayId)
              .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          );

          const incoming = { ...action.payload.component };
          if (!incoming.id || existingIds.has(incoming.id)) {
            incoming.id = uuidv4();
          }

          const baseType = incoming.type === 'text_input' ? 'textbox' : (incoming.type === 'text' ? 'label' : incoming.type);
          const escapedBase = baseType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const suffixRegex = new RegExp(`^${escapedBase}(\\d+)$`);
          const numericSuffixes = Array.from(existingDisplayIds)
            .map((id) => id.match(suffixRegex))
            .filter((m): m is RegExpMatchArray => Boolean(m))
            .map((m) => Number.parseInt(m[1], 10))
            .filter((n) => Number.isFinite(n));

          let nextIndex = numericSuffixes.length > 0
            ? Math.max(...numericSuffixes) + 1
            : s.components.filter((c) => c.type === incoming.type).length + 1;

          let nextDisplayId = `${baseType}${nextIndex}`;
          if (typeof incoming.displayId === 'string' && incoming.displayId.trim() && !existingDisplayIds.has(incoming.displayId.trim())) {
            nextDisplayId = incoming.displayId.trim();
          } else {
            while (existingDisplayIds.has(nextDisplayId)) {
              nextIndex += 1;
              nextDisplayId = `${baseType}${nextIndex}`;
            }
          }

          incoming.displayId = nextDisplayId;
          addedComponentId = incoming.id;

          return { ...s, components: [...s.components, incoming] };
        }),
        selectedComponentId: addedComponentId,
      };
      }

    case 'UPDATE_COMPONENT': {
      const selectedId = state.selectedComponentId;
      const newComponentId = action.payload.component.id;
      const updatedScreens = state.screens.map((s) => {
        if (s.id !== action.payload.screenId) return s;

        const nextComponents = [...s.components];
        const indexByNewId = nextComponents.findIndex((c) => c.id === newComponentId);

        if (indexByNewId >= 0) {
          nextComponents[indexByNewId] = action.payload.component;
          return { ...s, components: nextComponents };
        }

        // Supports manual ID edits where the new ID does not exist yet.
        if (selectedId) {
          const indexBySelected = nextComponents.findIndex((c) => c.id === selectedId);
          if (indexBySelected >= 0) {
            nextComponents[indexBySelected] = action.payload.component;
            return { ...s, components: nextComponents };
          }
        }

        return s;
      });

      const idChanged = Boolean(selectedId && selectedId !== newComponentId);
      return {
        ...state,
        screens: updatedScreens,
        selectedComponentId: idChanged ? newComponentId : state.selectedComponentId,
      };
    }

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
  updateProjectSettings: (settings: Partial<Project>) => void;
  addScreen: () => void;
  duplicateActiveScreen: () => void;
  deleteScreen: (id: string) => void;
  renameScreen: (id: string, name: string) => void;
  setActiveScreen: (id: string) => void;
  updateActiveScreenSettings: (settings: Partial<Screen>) => void;
        // Patch: Convert UUID ids to human-friendly if needed
  addComponent: (component: CanvasComponent) => void;
  updateComponent: (component: CanvasComponent) => void;
  deleteComponent: (componentId: string) => void;
  selectComponent: (id: string | null) => void;
  moveComponent: (componentId: string, x: number, y: number) => void;
  downloadExportZip: (type: DeployUIType) => Promise<void>;
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

export function CMSProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cmsReducer, initialState);
  const currentProjectFileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const latestStateRef = useRef<CMSState>(state);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  const activeScreen = state.screens.find((s) => s.id === state.activeScreenId);
  const selectedComponent = activeScreen?.components.find((c) => c.id === state.selectedComponentId);

  const importProjectState = useCallback((importedState: any) => {
    if (!importedState.project || !importedState.screens) {
      alert('Invalid project file. Please select a valid PINEVO project file.');
      return false;
    }

    const usedScreenIds = new Set<string>();
    const usedComponentIds = new Set<string>();

    const toBaseDisplayId = (component: any): string => {
      if (component?.type === 'text_input') return 'textbox';
      if (component?.type === 'text') return 'label';
      return typeof component?.type === 'string' && component.type.trim() ? component.type.trim() : 'component';
    };

    const normalizeDisplayId = (raw: any, fallbackBase: string, used: Set<string>): string => {
      const candidate = typeof raw === 'string' && raw.trim() ? raw.trim() : fallbackBase;
      let next = candidate;
      let n = 2;
      while (used.has(next)) {
        next = `${candidate}_${n}`;
        n += 1;
      }
      used.add(next);
      return next;
    };

    importedState.screens = importedState.screens.map((screen: any, screenIdx: number) => {
      const nextScreen = { ...screen };
      if (typeof nextScreen.id !== 'string' || !nextScreen.id || usedScreenIds.has(nextScreen.id)) {
        nextScreen.id = uuidv4();
      }
      usedScreenIds.add(nextScreen.id);

      const usedDisplayIds = new Set<string>();
      const components = Array.isArray(nextScreen.components) ? nextScreen.components : [];

      nextScreen.components = components.map((component: any, componentIdx: number) => {
        const nextComponent = { ...component };

        if (typeof nextComponent.id !== 'string' || !nextComponent.id || usedComponentIds.has(nextComponent.id)) {
          nextComponent.id = uuidv4();
        }
        usedComponentIds.add(nextComponent.id);

        const fallbackBase = `${toBaseDisplayId(nextComponent)}${componentIdx + 1}`;
        nextComponent.displayId = normalizeDisplayId(nextComponent.displayId, fallbackBase, usedDisplayIds);

        if (nextComponent.type === 'text' && nextComponent.labelKey && nextComponent.labelMode !== 'lang') {
          nextComponent.labelMode = 'lang';
        }

        return nextComponent;
      });

      if (!nextScreen.name || typeof nextScreen.name !== 'string') {
        nextScreen.name = `Screen ${screenIdx + 1}`;
      }

      return nextScreen;
    });

    const projectLanguages = (importedState.languages && typeof importedState.languages === 'object')
      ? importedState.languages
      : {};
    replaceAllPersistedLanguages(projectLanguages, { emit: true });

    const importedProject = {
      ...importedState.project,
      defaultCanvasBgColor: importedState.project?.defaultCanvasBgColor || '#ffffff',
    };

    dispatch({ type: 'SET_PROJECT', payload: importedProject });
    dispatch({ type: 'SET_SCREENS', payload: importedState.screens });
    dispatch({ type: 'SET_ACTIVE_SCREEN', payload: importedState.activeScreenId || importedState.screens[0]?.id });
    dispatch({ type: 'UPDATE_SANDBOX_CONFIG', payload: importedState.sandboxConfig || {} });
    return true;
  }, []);

  const tryRestorePersistedProjectHandle = useCallback(async (interactive: boolean): Promise<boolean> => {
    const persistedHandle = await loadPersistedProjectFileHandle();
    if (!persistedHandle) {
      return false;
    }

    currentProjectFileHandleRef.current = persistedHandle;

    try {
      const handleAny = persistedHandle as any;
      if (typeof handleAny.queryPermission === 'function') {
        let status = await handleAny.queryPermission({ mode: 'read' });
        if (status !== 'granted') {
          if (interactive && typeof handleAny.requestPermission === 'function') {
            status = await handleAny.requestPermission({ mode: 'read' });
          }
          if (status !== 'granted') {
            return false;
          }
        }
      }

      const file = await persistedHandle.getFile();
      const text = await file.text();
      const projectData = JSON.parse(text);
      const importedState = projectData.state || projectData;
      const ok = importProjectState(importedState);
      if (!ok) {
        currentProjectFileHandleRef.current = null;
        void savePersistedProjectFileHandle(null);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Failed to restore persisted project handle:', err);
      return false;
    }
  }, [importProjectState]);

  useEffect(() => {
    void (async () => {
      void tryRestorePersistedProjectHandle(false);
    })();
  }, [tryRestorePersistedProjectHandle]);

  const setProject = useCallback((project: { name: string; type: 'pin_evo' | 'flex' }) => {
    replaceAllPersistedLanguages({ en: {} }, { emit: false });
    const newProject: Project = {
      id: uuidv4(),
      name: project.name,
      type: project.type,
      defaultCanvasBgColor: '#ffffff',
    };
    dispatch({ type: 'SET_PROJECT', payload: newProject });
  }, []);

  const updateProjectSettings = useCallback((settings: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: settings });
  }, []);

  const addScreen = useCallback(() => {
    const newScreen: Screen = {
      id: uuidv4(),
      name: `Screen ${state.screens.length + 1}`,
      components: [],
    };
    dispatch({ type: 'ADD_SCREEN', payload: newScreen });
  }, [state.screens.length]);

  const duplicateActiveScreen = useCallback(() => {
    const sourceScreen = state.screens.find((s) => s.id === state.activeScreenId);
    if (!sourceScreen) {
      return;
    }

    const clonedScreen: Screen = {
      ...sourceScreen,
      id: uuidv4(),
      name: `Screen ${state.screens.length + 1}`,
      components: sourceScreen.components.map((component) => ({
        ...component,
        id: uuidv4(),
      })),
    };

    dispatch({ type: 'ADD_SCREEN', payload: clonedScreen });
  }, [state.activeScreenId, state.screens]);

  const deleteScreen = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCREEN', payload: id });
  }, []);

  const renameScreen = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME_SCREEN', payload: { id, name } });
  }, []);

  const setActiveScreen = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_SCREEN', payload: id });
  }, []);

  const updateActiveScreenSettings = useCallback((settings: Partial<Screen>) => {
    if (!state.activeScreenId) return;
    dispatch({ type: 'UPDATE_SCREEN', payload: { id: state.activeScreenId, patch: settings } });
  }, [state.activeScreenId]);

  // Generate a default unique ID for a new component based on type and index in the screen
  const addComponent = useCallback(
    (component: CanvasComponent) => {
      const screen = state.screens.find(s => s.id === state.activeScreenId);
      if (screen) {
        const baseType = component.type === 'text_input' ? 'textbox' : (component.type === 'text' ? 'label' : component.type);
        const usedDisplayIds = new Set(
          screen.components
            .map((c) => c.displayId)
            .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        );

        const escapedBase = baseType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const suffixRegex = new RegExp(`^${escapedBase}(\\d+)$`);
        const numericSuffixes = Array.from(usedDisplayIds)
          .map((id) => id.match(suffixRegex))
          .filter((m): m is RegExpMatchArray => Boolean(m))
          .map((m) => Number.parseInt(m[1], 10))
          .filter((n) => Number.isFinite(n));

        let index = numericSuffixes.length > 0
          ? Math.max(...numericSuffixes) + 1
          : screen.components.filter((c) => c.type === component.type).length + 1;

        let displayId = `${baseType}${index}`;
        const isDisplayIdUsed = (id: string) => usedDisplayIds.has(id);
        while (isDisplayIdUsed(displayId)) {
          index++;
          displayId = `${baseType}${index}`;
        }
        // Always assign a unique displayId, regardless of what is in the defaults
        let compWithId = { ...component, id: uuidv4(), displayId };
        dispatch({ type: 'ADD_COMPONENT', payload: { screenId: state.activeScreenId, component: compWithId } });
      }
    },
    [state.activeScreenId, state.screens]
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

  const downloadExportZip = useCallback(async (type: DeployUIType) => {
    if (type === 'html' && !FEATURE_FLAGS.enableHtmlUiFormat) {
      throw new Error('HTML export is disabled in configuration.');
    }

    if (type === 'json' && !FEATURE_FLAGS.enableJsonUiFormat) {
      throw new Error('JSON export is disabled in configuration.');
    }

    const bundle = type === 'html'
      ? await generateHtmlExport(state)
      : await generateJsonScreensExport(state);

    downloadFile(bundle.blob, 'application/zip', bundle.fileName);
  }, [state]);

  const saveScreens = useCallback(async () => {
    await downloadExportZip('json');
  }, [downloadExportZip]);

  const saveAsHtml = useCallback(async () => {
    await downloadExportZip('html');
  }, [downloadExportZip]);
  const saveProject = useCallback(async () => {
    if (!state.project) {
      alert('No project to save. Please create or open a project first.');
      return;
    }

    const buildProjectData = (sourceState: CMSState) => ({
      project: sourceState.project,
      screens: sourceState.screens,
      activeScreenId: sourceState.activeScreenId,
      sandboxConfig: sourceState.sandboxConfig,
      languages: getAllPersistedLanguages(),
    });

    const projectData = buildProjectData(state);

    const json = JSON.stringify(projectData, null, 2);
    const pickerWindow = globalThis as any;

    try {
      if (typeof pickerWindow.showSaveFilePicker === 'function') {
        let handle = currentProjectFileHandleRef.current;

        if (!handle) {
          handle = await pickerWindow.showSaveFilePicker({
            suggestedName: `${state.project.name.replaceAll(' ', '_')}_project.json`,
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            }],
          });
          currentProjectFileHandleRef.current = handle;
          void savePersistedProjectFileHandle(handle);
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
    a.download = `${state.project.name.replaceAll(' ', '_')}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.project, state.screens, state.activeScreenId, state.sandboxConfig]);

  useEffect(() => {
    const onLanguagesChanged = () => {
      const fileHandle = currentProjectFileHandleRef.current;
      const currentState = latestStateRef.current;
      if (!currentState.project) {
        return;
      }

      const payload = {
        project: currentState.project,
        screens: currentState.screens,
        activeScreenId: currentState.activeScreenId,
        sandboxConfig: currentState.sandboxConfig,
        languages: getAllPersistedLanguages(),
      };

      if (!fileHandle) {
        return;
      }

      void (async () => {
        try {
          const fileHandleAny = fileHandle as any;
          if (typeof fileHandleAny.queryPermission === 'function') {
            const status = await fileHandleAny.queryPermission({ mode: 'readwrite' });
            if (status !== 'granted') {
              // Avoid SecurityError from non-user-activation contexts.
              return;
            }
          }

          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(payload, null, 2));
          await writable.close();
        } catch (err) {
          console.warn('Failed to auto-save language changes to opened project file:', err);
        }
      })();
    };

    window.addEventListener('pinevo-languages-changed', onLanguagesChanged as EventListener);
    return () => {
      window.removeEventListener('pinevo-languages-changed', onLanguagesChanged as EventListener);
    };
  }, []);

  const loadProject = useCallback(() => {
    const pickerWindow = globalThis as any;

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

          currentProjectFileHandleRef.current = handle;
          void savePersistedProjectFileHandle(handle);
          importProjectState(importedState);
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

        currentProjectFileHandleRef.current = null;
        void savePersistedProjectFileHandle(null);
        importProjectState(importedState);
      } catch (err) {
        console.error('Error loading project:', err);
        alert('Failed to load project. Please select a valid PINEVO project file.');
      }
    };
    input.click();
  }, [importProjectState]);

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
    const normalizedConfig: HardwareButtonConfig = {
      ...config,
      goToScreen: config.inputAction ? undefined : config.goToScreen,
      inputAction: config.goToScreen ? undefined : config.inputAction,
      submitGoToScreen: config.inputAction === 'submit' ? config.submitGoToScreen : undefined,
    };

    dispatch({ type: 'UPDATE_SCREEN_HARDWARE_BUTTON', payload: { screenId, buttonId, config: normalizedConfig } });
  }, []);

  const clearSession = useCallback(() => {
    replaceAllPersistedLanguages({ en: {} }, { emit: false });
    currentProjectFileHandleRef.current = null;
    void savePersistedProjectFileHandle(null);
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const contextValue = React.useMemo(() => ({
    state,
    activeScreen,
    selectedComponent,
    setProject,
    updateProjectSettings,
    addScreen,
    duplicateActiveScreen,
    deleteScreen,
    renameScreen,
    setActiveScreen,
    updateActiveScreenSettings,
    addComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
    moveComponent,
    downloadExportZip,
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
  }), [state, activeScreen, selectedComponent, setProject, updateProjectSettings, addScreen, duplicateActiveScreen, deleteScreen, renameScreen, setActiveScreen, updateActiveScreenSettings, addComponent, updateComponent, deleteComponent, selectComponent, moveComponent, downloadExportZip, saveScreens, saveAsHtml, saveProject, loadProject, setSandboxMode, setPreviewMode, updateSandboxConfig, resetSandboxConfig, updateScreenHardwareButton, clearSession]);
  return (
    <CMSContext.Provider value={contextValue}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const ctx = useContext(CMSContext);
  if (!ctx) throw new Error('useCMS must be used inside CMSProvider');
  return ctx;
}
