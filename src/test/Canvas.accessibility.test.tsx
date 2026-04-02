import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from '../components/Canvas/Canvas';
import { CMSProvider } from '../context/AppContext';

// Mock the useCMS hook
vi.mock('../context/AppContext', async () => {
    const actual = await vi.importActual('../context/AppContext');
    return {
        ...actual,
        useCMS: () => ({
            state: {
                project: { id: '1', name: 'Test Project', type: 'pin_evo' as const },
                screens: [{ id: '1', name: 'Screen 1', components: [] }],
                activeScreenId: '1',
                selectedComponentId: null,
                sandboxMode: false,
                sandboxConfig: {
                    carrier: '',
                    servicePoint: '',
                    shipmentId: '',
                    shipmentType: '',
                    allocationType: '',
                    expiry: '',
                },
            },
            activeScreen: { id: '1', name: 'Screen 1', components: [] },
            addComponent: vi.fn(),
            moveComponent: vi.fn(),
            selectComponent: vi.fn(),
            setProject: vi.fn(),
            addScreen: vi.fn(),
            deleteScreen: vi.fn(),
            renameScreen: vi.fn(),
            setActiveScreen: vi.fn(),
            updateComponent: vi.fn(),
            deleteComponent: vi.fn(),
            saveScreens: vi.fn(),
            saveAsHtml: vi.fn(),
            setSandboxMode: vi.fn(),
            updateSandboxConfig: vi.fn(),
            resetSandboxConfig: vi.fn(),
        }),
    };
});

describe('Canvas Accessibility', () => {
    it('should have proper ARIA role for canvas area', () => {
        render(
            <DndProvider backend={HTML5Backend}>
                <CMSProvider>
                    <Canvas />
                </CMSProvider>
            </DndProvider>
        );

        const canvas = screen.getByRole('application');
        expect(canvas).toBeInTheDocument();
    });

    it('should have accessible label for canvas', () => {
        render(
            <DndProvider backend={HTML5Backend}>
                <CMSProvider>
                    <Canvas />
                </CMSProvider>
            </DndProvider>
        );

        expect(screen.getByRole('application')).toHaveAttribute('aria-label', 'Component canvas - drag and drop area');
    });

    it('should have describedby for canvas label', () => {
        render(
            <DndProvider backend={HTML5Backend}>
                <CMSProvider>
                    <Canvas />
                </CMSProvider>
            </DndProvider>
        );

        expect(screen.getByRole('application')).toHaveAttribute('aria-describedby');
    });
});
