import { useState, useRef, useEffect } from 'react';
import './NewProjectModal.css';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type: 'pin_evo' | 'flex') => void;
}

export default function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState<'pin_evo' | 'flex'>('pin_evo');
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            // Focus the first input after a short delay
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
        } else {
            // Return focus to trigger element
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectName.trim()) {
            onCreate(projectName.trim(), projectType);
            setProjectName('');
            setProjectType('pin_evo');
        }
    };

    const handleClose = () => {
        setProjectName('');
        setProjectType('pin_evo');
        onClose();
    };

    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="modal-title">Create New Project</h2>
                    <button
                        ref={closeButtonRef}
                        className="modal-close"
                        onClick={handleClose}
                        aria-label="Close dialog"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="projectName">Project Name</label>
                            <input
                                id="projectName"
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Enter project name"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="projectType">Project Type</label>
                            <select
                                id="projectType"
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value as 'pin_evo' | 'flex')}
                            >
                                <option value="pin_evo">1 - PIN Evo</option>
                                <option value="flex">2 - Flex</option>
                            </select>
                        </div>

                        <div className="project-type-info">
                            {projectType === 'pin_evo' ? (
                                <div className="info-card pin-evo">
                                    <h4>PIN Evo</h4>
                                    <p>Canvas: 600 x 480px</p>
                                    <p>Hardware: PIN Evo device</p>
                                </div>
                            ) : (
                                <div className="info-card flex">
                                    <h4>Flex</h4>
                                    <p>Canvas: 480 x 800px</p>
                                    <p>Hardware: Flex device with touch display</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-create" disabled={!projectName.trim()}>
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
