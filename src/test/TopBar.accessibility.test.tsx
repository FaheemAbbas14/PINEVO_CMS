import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopBar from '../components/TopBar/TopBar';
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
            setProject: vi.fn(),
            addScreen: vi.fn(),
            deleteScreen: vi.fn(),
            renameScreen: vi.fn(),
            setActiveScreen: vi.fn(),
            addComponent: vi.fn(),
            updateComponent: vi.fn(),
            deleteComponent: vi.fn(),
            selectComponent: vi.fn(),
            moveComponent: vi.fn(),
            saveScreens: vi.fn(),
            saveAsHtml: vi.fn(),
            setSandboxMode: vi.fn(),
            updateSandboxConfig: vi.fn(),
            resetSandboxConfig: vi.fn(),
        }),
    };
});

describe('TopBar Accessibility', () => {
    it('should have accessible buttons with aria-labels', () => {
        render(
            <CMSProvider>
                <TopBar />
            </CMSProvider>
        );

        expect(screen.getByRole('button', { name: /create new project/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export options/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /deploy project/i })).toBeInTheDocument();
    });

    it('should have proper tablist for screen tabs', () => {
        render(
            <CMSProvider>
                <TopBar />
            </CMSProvider>
        );

        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
    });

    it('should have tabs with proper ARIA attributes', () => {
        render(
            <CMSProvider>
                <TopBar />
            </CMSProvider>
        );

        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);

        // First tab should be selected
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
});
