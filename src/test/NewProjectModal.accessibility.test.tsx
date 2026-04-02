import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewProjectModal from '../components/NewProjectModal/NewProjectModal';

describe('NewProjectModal Accessibility', () => {
    const mockOnClose = vi.fn();
    const mockOnCreate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have proper ARIA attributes when open', () => {
        render(
            <NewProjectModal
                isOpen={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        const modal = screen.getByRole('dialog');
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have accessible title', () => {
        render(
            <NewProjectModal
                isOpen={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    it('should have proper form labels', () => {
        render(
            <NewProjectModal
                isOpen={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/project type/i)).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
        render(
            <NewProjectModal
                isOpen={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        const closeButton = screen.getByRole('button', { name: /close dialog/i });
        expect(closeButton).toBeInTheDocument();
    });

    it('should handle escape key to close modal', async () => {
        const user = userEvent.setup();
        render(
            <NewProjectModal
                isOpen={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        await user.keyboard('{Escape}');
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('should not render when closed', () => {
        render(
            <NewProjectModal
                isOpen={false}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
