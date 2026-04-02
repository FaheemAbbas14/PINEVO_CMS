# PINEVO CMS - Product Requirements Document

**Version:** 1.0  
**Date:** March 18, 2026  
**Status:** Active Development

---

## 1. Executive Summary

### 1.1 Purpose
The PINEVO Content Management System (CMS) is a web-based visual editor designed for creating, managing, and deploying content to PINEVO hardware devices (PIN Evo and Flex). The system enables users to design multi-screen interfaces with various interactive components through an intuitive drag-and-drop interface.

### 1.2 Target Users
- **Primary:** Content creators and UI designers working with PINEVO hardware devices
- **Secondary:** System integrators and deployment engineers

### 1.3 Product Vision
To provide a no-code visual editor that simplifies the creation of interactive content for PINEVO PIN devices, reducing development time and enabling rapid prototyping.

---

## 2. Technical Specifications

### 2.1 Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Drag & Drop | react-dnd |
| State Management | React Context API |
| Testing | Vitest + React Testing Library |
| Styling | CSS Modules |

### 2.2 Hardware Canvas Dimensions
| Device Type | Width (px) | Height (px) |
|-------------|------------|-------------|
| PIN Evo | 600 | 480 |
| Flex | 480 | 800 |

---

## 3. Feature EPICs

### EPIC 1: Project Management
**Description:** Create and manage PINEVO projects with different device configurations.

### EPIC 2: Multi-Screen Management  
**Description:** Create, organize, and navigate between multiple screens within a project.

### EPIC 3: Component Palette
**Description:** Provide a library of draggable UI components for screen design.

### EPIC 4: Visual Canvas Editor
**Description:** Enable visual positioning and arrangement of components on screens.

### EPIC 5: Component Properties Editor
**Description:** Configure properties and behaviors of each component via a property panel.

### EPIC 6: Preview & Simulation
**Description:** Preview screens in device frame with interactive simulation.

### EPIC 7: Sandbox Mode
**Description:** Test components with configurable mock data and device states.

### EPIC 8: Export & Deployment
**Description:** Export project data in various formats for deployment.

---

## 4. User Stories and Acceptance Criteria

---

### EPIC 1: Project Management

#### US 1.1: Create New Project
**As a** user,  
**I want to** create a new PINEVO project,  
**So that** I can start designing content for a specific device type.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 1 |

**Acceptance Criteria:**
- [ ] User can enter project name
- [ ] User can select project type (PIN Evo or Flex)
- [ ] Modal validates required fields before creation
- [ ] New project initializes with one default screen
- [ ] Project type determines canvas dimensions

**Validation Rules:**
- Project name: Required, 1-50 characters
- Project type: Required, must be 'pin_evo' or 'flex'

---

#### US 1.2: Project Type Selection
**As a** user,  
**I want to** choose between PIN Evo and Flex device types,  
**So that** my design matches the target hardware.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 1 |

**Acceptance Criteria:**
- [ ] PIN Evo option shows 600x480px canvas
- [ ] Flex option shows 480x800px canvas
- [ ] Selection is locked after project creation
- [ ] Visual indicator shows current device type

---

### EPIC 2: Multi-Screen Management

#### US 2.1: Create New Screen
**As a** user,  
**I want to** add new screens to my project,  
**So that** I can create multi-screen applications.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 2 |

**Acceptance Criteria:**
- [ ] "+" button in TopBar creates new screen
- [ ] New screen gets default name "Screen N" (auto-increment)
- [ ] New screen becomes active immediately
- [ ] Maximum 20 screens per project

---

#### US 2.2: Rename Screen
**As a** user,  
**I want to** rename screens for better organization,  
**So that** I can identify screens by purpose.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 2 |

**Acceptance Criteria:**
- [ ] Double-click on screen tab enables inline edit
- [ ] Pressing Enter saves the new name
- [ ] Pressing Escape cancels editing
- [ ] Tab shows updated name immediately

---

#### US 2.3: Delete Screen
**As a** user,  
**I want to** delete unwanted screens,  
**So that** I can keep my project clean.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 2 |

**Acceptance Criteria:**
- [ ] Right-click on screen shows context menu
- [ ] "Delete" option removes the screen
- [ ] Cannot delete the last remaining screen
- [ ] Confirmation not required for single screen deletion

---

#### US 2.4: Switch Between Screens
**As a** user,  
**I want to** navigate between screens,  
**So that** I can edit different screens.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 2 |

**Acceptance Criteria:**
- [ ] Clicking screen tab makes it active
- [ ] Active screen tab is visually highlighted
- [ ] Canvas shows components of active screen
- [ ] Arrow key navigation between tabs

---

### EPIC 3: Component Palette

#### US 3.1: View Component Palette
**As a** user,  
**I want to** see available components in the sidebar,  
**So that** I know what I can add to my screens.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 3 |

**Acceptance Criteria:**
- [ ] Left sidebar displays all component types
- [ ] Each component shows icon and label
- [ ] Components are grouped logically
- [ ] Tooltip shows component description

**Component Types:**
| Type | Icon | Description |
|------|------|-------------|
| Text | T | Static text display |
| Button | ☐ | Interactive button |
| Image | 🖼️ | Image display |
| API | ⚡ | API endpoint marker |
| Command | >_ | Command executor |
| Audio | 🔊 | Audio player |

---

#### US 3.2: Drag Component to Canvas
**As a** user,  
**I want to** drag components from palette to canvas,  
**So that** I can add them to my screen.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 3 |

**Acceptance Criteria:**
- [ ] Component can be dragged from palette
- [ ] Drag preview shows component representation
- [ ] Dropping on canvas adds component at drop position
- [ ] Component is auto-selected after drop

---

#### US 3.3: Keyboard Accessibility for Palette
**As a** user,  
**I want to** add components using keyboard,  
**So that** I can use the CMS without a mouse.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 3 |

**Acceptance Criteria:**
- [ ] Tab key navigates to palette items
- [ ] Enter key adds component to canvas
- [ ] Screen reader announces component details

---

### EPIC 4: Visual Canvas Editor

#### US 4.1: View Canvas
**As a** user,  
**I want to** see the canvas area,  
**So that** I can design my screen layout.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 4 |

**Acceptance Criteria:**
- [ ] Canvas shows correct dimensions for device type
- [ ] Grid overlay helps with alignment
- [ ] Empty state shows "Drag components here" message

---

#### US 4.2: Select Component on Canvas
**As a** user,  
**I want to** click on a component to select it,  
**So that** I can modify its properties.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 4 |

**Acceptance Criteria:**
- [ ] Clicking component selects it
- [ ] Selected component shows visual highlight
- [ ] Clicking empty canvas deselects
- [ ] Right sidebar shows component properties

---

#### US 4.3: Move Component on Canvas
**As a** user,  
**I want to** drag components to reposition them,  
**So that** I can arrange my layout.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 4 |

**Acceptance Criteria:**
- [ ] Component can be dragged after initial placement
- [ ] Component stays within canvas bounds
- [ ] Dragging shows real-time position update
- [ ] Component selection is maintained during drag

---

#### US 4.4: Delete Component from Canvas
**As a** user,  
**I want to** remove components from canvas,  
**So that** I can clean up unwanted elements.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 4 |

**Acceptance Criteria:**
- [ ] Delete button in right sidebar removes component
- [ ] Delete key removes selected component
- [ ] Component is removed immediately

---

#### US 4.5: Zoom Canvas
**As a** user,  
**I want to** zoom in and out of the canvas,  
**So that** I can work with large or small layouts.

| Field | Value |
|-------|-------|
| Priority | P2 - Medium |
| Epic | EPIC 4 |

**Acceptance Criteria:**
- [ ] Mouse wheel zooms canvas
- [ ] Zoom range: 50% to 200%
- [ ] Zoom level persists during session

---

### EPIC 5: Component Properties Editor

#### US 5.1: View Component Properties
**As a** user,  
**I want to** see properties panel when component is selected,  
**So that** I can configure the component.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 5 |

**Acceptance Criteria:**
- [ ] Right sidebar shows when component selected
- [ ] Properties vary by component type
- [ ] Empty state when no component selected

---

#### US 5.2: Edit Text Component Properties
**As a** user,  
**I want to** edit text content and styling,  
**So that** I can customize text displays.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 5 |

**Properties:**
| Property | Type | Default |
|----------|------|---------|
| Text | string | "Text Field" |
| Font Size | number | 16 |
| Color | hex | #1a1a2e |
| Width | number | 160 |
| Height | number | 40 |

---

#### US 5.3: Edit Button Component Properties
**As a** user,  
**I want to** configure button behavior and styling,  
**So that** I can create interactive buttons.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 5 |

**Properties:**
| Property | Type | Default |
|----------|------|---------|
| Text | string | "Button" |
| Font Size | number | 14 |
| Color | hex | #ffffff |
| Background | hex | #4f46e5 |
| Border Radius | number | 8 |
| Function | enum | none |
| Go To Screen | string | - |
| Button Sound | URL | - |

**Button Functions:**
- none
- connect
- open_door
- get_capacity
- api_call
- play_sound

---

#### US 5.4: Edit Image Component Properties
**As a** user,  
**I want to** add and configure images,  
**So that** I can include visual media.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 5 |

**Properties:**
| Property | Type | Default |
|----------|------|---------|
| Image URL | URL | - |
| Width | number | 120 |
| Height | number | 90 |

---

#### US 5.5: Edit Audio Component Properties
**As a** user,  
**I want to** add audio files to my screens,  
**So that** I can include sound content.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 5 |

**Properties:**
| Property | Type | Default |
|----------|------|---------|
| Audio URL | URL | - |
| Width | number | 200 |
| Height | number | 60 |

---

#### US 5.6: Edit API Component Properties
**As a** user,  
**I want to** configure API endpoint markers,  
**So that** I can integrate external services.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 5 |

**Properties:**
| Property | Type | Default |
|----------|------|---------|
| API URL | URL | https://api.example.com |
| HTTP Method | enum | GET |
| Headers | JSON | - |
| Request Body | JSON | - |
| Width | number | 140 |
| Height | number | 50 |

---

#### US 5.7: Edit Command Component Properties
**As a** user,  
**I want to** define command executors,  
**So that** I can trigger system commands.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 5 |

**Properties:**
| Property | Type | Default |
|----------|------|---------|
| Command | string | echo "hello" |
| Width | number | 140 |
| Height | number | 50 |

---

### EPIC 6: Preview & Simulation

#### US 6.1: Preview Screen in Device Frame
**As a** user,  
**I want to** preview my screen in a device frame,  
**So that** I can see how it looks on actual hardware.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 6 |

**Acceptance Criteria:**
- [ ] Preview panel shows device frame
- [ ] Frame matches selected device type (PIN Evo/Flex)
- [ ] Components render as they would on device

---

#### US 6.2: Interactive Component Preview
**As a** user,  
**I want to** interact with components in preview,  
**So that** I can test button functions and navigation.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 6 |

**Acceptance Criteria:**
- [ ] Clicking button triggers configured action
- [ ] Navigation buttons switch to target screen
- [ ] Audio play button plays sound

---

#### US 6.3: Navigate Between Screens in Preview
**As a** user,  
**I want to** navigate between screens in preview mode,  
**So that** I can test multi-screen flows.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 6 |

**Acceptance Criteria:**
- [ ] Navigation buttons show target screen
- [ ] Screen transitions work correctly
- [ ] Back navigation returns to previous screen

---

### EPIC 7: Sandbox Mode

#### US 7.1: Enable Sandbox Mode
**As a** user,  
**I want to** toggle sandbox mode,  
**So that** I can test with mock data.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 7 |

**Acceptance Criteria:**
- [ ] Toggle switch in right sidebar enables sandbox
- [ ] Banner indicates sandbox mode is active
- [ ] Status announced to screen readers

---

#### US 7.2: Configure Sandbox Data
**As a** user,  
**I want to** set mock data values,  
**So that** I can simulate different scenarios.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 7 |

**Sandbox Configuration:**
| Field | Type | Default |
|-------|------|---------|
| Carrier | string | "" |
| Service Point | string | "" |
| Shipment ID | string | "" |
| Shipment Type | string | "" |
| Allocation Type | string | "" |
| Expiry | string | "" |

---

#### US 7.3: Reset Sandbox Configuration
**As a** user,  
**I want to** reset all sandbox values to defaults,  
**So that** I can start fresh.

| Field | Value |
|-------|-------|
| Priority | P2 - Medium |
| Epic | EPIC 7 |

**Acceptance Criteria:**
- [ ] Reset button clears all sandbox fields
- [ ] Toast message confirms reset

---

### EPIC 8: Export & Deployment

#### US 8.1: Export as JSON
**As a** user,  
**I want to** export my project as JSON,  
**So that** I can save or version control my work.

| Field | Value |
|-------|-------|
| Priority | P0 - Critical |
| Epic | EPIC 8 |

**Acceptance Criteria:**
- [ ] Export dropdown in TopBar
- [ ] JSON includes all screens and components
- [ ] File downloads as "screens.json"

---

#### US 8.2: Export as HTML
**As a** user,  
**I want to** export my project as standalone HTML,  
**So that** I can share previews with others.

| Field | Value |
|-------|-------|
| Priority | P1 - High |
| Epic | EPIC 8 |

**Acceptance Criteria:**
- [ ] HTML export option in dropdown
- [ ] Generated HTML is self-contained
- [ ] File downloads as "screens.html"
- [ ] All screens render in browser

---

#### US 8.3: Deploy Project
**As a** user,  
**I want to** deploy my project,  
**So that** it can be uploaded to PINEVO devices.

| Field | Value |
|-------|-------|
| Priority | P2 - Medium |
| Epic | EPIC 8 |

**Acceptance Criteria:**
- [ ] Deploy button in TopBar
- [ ] Button shows disabled state when no project
- [ ] Placeholder functionality (integration TBD)

---

## 5. Test Cases

### TC 1: Project Management

#### TC 1.1: Create New Project - PIN Evo
| ID | TC 1.1 |
|----|--------|
| Feature | US 1.1 |
| Description | Create new PIN Evo project |

**Steps:**
1. Click "Create New Project" button
2. Enter project name "Test Project"
3. Select "PIN Evo" type
4. Click "Create"

**Expected Result:**
- Modal closes
- Canvas shows 600x480 dimensions
- One default screen created with name "Screen 1"

---

#### TC 1.2: Create New Project - Flex
| ID | TC 1.2 |
|----|--------|
| Feature | US 1.2 |
| Description | Create new Flex project |

**Steps:**
1. Click "Create New Project" button
2. Enter project name "Flex App"
3. Select "Flex" type
4. Click "Create"

**Expected Result:**
- Canvas shows 480x800 dimensions

---

### TC 2: Screen Management

#### TC 2.1: Create New Screen
| ID | TC 2.1 |
|----|--------|
| Feature | US 2.1 |
| Description | Add new screen to project |

**Steps:**
1. Click "+" button in TopBar

**Expected Result:**
- New tab "Screen 2" appears
- Screen 2 is active
- Canvas is empty

---

#### TC 2.2: Rename Screen
| ID | TC 2.2 |
|----|--------|
| Feature | US 2.2 |
| Description | Rename screen via double-click |

**Steps:**
1. Double-click on "Screen 1" tab
2. Type "Home Screen"
3. Press Enter

**Expected Result:**
- Tab shows "Home Screen"

---

#### TC 2.3: Delete Screen
| ID | TC 2.3 |
|----|--------|
| Feature | US 2.3 |
| Description | Delete a screen |

**Steps:**
1. Right-click on "Screen 2" tab
2. Select "Delete"

**Expected Result:**
- Screen 2 is removed
- Screen 1 becomes active

---

### TC 3: Component Management

#### TC 3.1: Add Text Component
| ID | TC 3.1 |
|----|--------|
| Feature | US 3.2 |
| Description | Drag text component to canvas |

**Steps:**
1. Drag "Text" from palette
2. Drop on canvas center

**Expected Result:**
- Text component appears at drop position
- Component is selected
- Properties panel shows text options

---

#### TC 3.2: Add Button Component
| ID | TC 3.2 |
|----|--------|
| Feature | US 3.2 |
| Description | Add button to canvas |

**Steps:**
1. Drag "Button" from palette
2. Drop on canvas

**Expected Result:**
- Button with "Button" text appears
- Blue background (#4f46e5)

---

#### TC 3.3: Move Component
| ID | TC 3.3 |
|----|--------|
| Feature | US 4.3 |
| Description | Reposition component on canvas |

**Steps:**
1. Click and hold on component
2. Drag to new position
3. Release

**Expected Result:**
- Component moves to new position
- Position persists

---

#### TC 3.4: Delete Component
| ID | TC 3.4 |
|----|--------|
| Feature | US 4.4 |
| Description | Remove component from canvas |

**Steps:**
1. Select component on canvas
2. Click "Delete" button in properties

**Expected Result:**
- Component removed from canvas
- Properties panel shows empty state

---

### TC 4: Component Properties

#### TC 4.1: Edit Text Content
| ID | TC 4.1 |
|----|--------|
| Feature | US 5.2 |
| Description | Change text component content |

**Steps:**
1. Select text component
2. In properties, change Text to "Hello World"
3. Change Font Size to 24

**Expected Result:**
- Canvas shows "Hello World" at size 24

---

#### TC 4.2: Configure Button Function
| ID | TC 4.2 |
|----|--------|
| Feature | US 5.3 |
| Description | Set button to navigate to screen |

**Steps:**
1. Create two screens: "Home" and "Details"
2. Add button to Home screen
3. In properties, set Go To Screen to "Details"
4. Click button in preview

**Expected Result:**
- Preview shows Details screen

---

#### TC 4.3: Add Image
| ID | TC 4.3 |
|----|--------|
| Feature | US 5.4 |
| Description | Add image to canvas |

**Steps:**
1. Drag "Image" to canvas
2. In properties, enter Image URL or upload file

**Expected Result:**
- Image displays on canvas

---

#### TC 4.4: Add Audio
| ID | TC 4.4 |
|----|--------|
| Feature | US 5.5 |
| Description | Add audio component |

**Steps:**
1. Drag "Audio" to canvas
2. Enter Audio URL in properties
3. Click play button on component

**Expected Result:**
- Audio plays

---

#### TC 4.5: Configure API Component
| ID | TC 4.5 |
|----|--------|
| Feature | US 5.6 |
| Description | Set API endpoint configuration |

**Steps:**
1. Drag "API" to canvas
2. Set API URL to "https://api.example.com/data"
3. Set HTTP Method to "POST"
4. Enter Headers JSON

**Expected Result:**
- API component shows endpoint info

---

### TC 5: Preview

#### TC 5.1: Preview Screen
| ID | TC 5.1 |
|----|--------|
| Feature | US 6.1 |
| Description | View screen in device frame |

**Steps:**
1. Add components to screen
2. Click Preview tab

**Expected Result:**
- Device frame shows with components
- PIN Evo shows 600x480 frame
- Flex shows 480x800 frame

---

#### TC 5.2: Test Button Navigation
| ID | TC 5.2 |
|----|--------|
| Feature | US 6.2 |
| Description | Navigate screens via button |

**Steps:**
1. Add button with Go To Screen configured
2. Enter Preview mode
3. Click the button

**Expected Result:**
- Screen switches to target screen

---

### TC 6: Sandbox Mode

#### TC 6.1: Enable Sandbox
| ID | TC 6.1 |
|----|--------|
| Feature | US 7.1 |
| Description | Toggle sandbox mode |

**Steps:**
1. Click sandbox toggle in right sidebar

**Expected Result:**
- Banner shows "Sandbox Mode Active"
- Sandbox configuration panel expands

---

#### TC 6.2: Configure Sandbox Data
| ID | TC 6.2 |
|----|--------|
| Feature | US 7.2 |
| Description | Set mock data values |

**Steps:**
1. Enable sandbox mode
2. Enter "DHL" in Carrier field
3. Enter "12345" in Service Point field

**Expected Result:**
- Values are saved
- Toast confirms configuration

---

#### TC 6.3: Reset Sandbox
| ID | TC 6.3 |
|----|--------|
| Feature | US 7.3 |
| Description | Reset sandbox to defaults |

**Steps:**
1. Configure sandbox values
2. Click "Reset" button

**Expected Result:**
- All fields cleared
- Toast shows "Sandbox configuration reset"

---

### TC 7: Export

#### TC 7.1: Export JSON
| ID | TC 7.1 |
|----|--------|
| Feature | US 8.1 |
| Description | Download project as JSON |

**Steps:**
1. Add screens and components
2. Click Export dropdown
3. Select "Export as JSON"

**Expected Result:**
- File downloads as "screens.json"
- JSON contains all screens and components

---

#### TC 7.2: Export HTML
| ID | TC 7.2 |
|----|--------|
| Feature | US 8.2 |
| Description | Download project as HTML |

**Steps:**
1. Add screens and components
2. Click Export dropdown
3. Select "Export as HTML"

**Expected Result:**
- File downloads as "screens.html"
- Opening HTML shows all screens

---

### TC 8: Accessibility

#### TC 8.1: Keyboard Navigation
| ID | TC 8.1 |
|----|--------|
| Feature | US 3.3 |
| Description | Add component via keyboard |

**Steps:**
1. Tab to palette item
2. Press Enter

**Expected Result:**
- Component added to canvas center

---

#### TC 8.2: Screen Reader Support
| ID | TC 8.2 |
|----|--------|
| Feature | Global |
| Description | Verify ARIA labels |

**Steps:**
1. Enable screen reader
2. Navigate through interface

**Expected Result:**
- All interactive elements have labels
- Modal announces properly

---

#### TC 8.3: Focus Management
| ID | TC 8.3 |
|----|--------|
| Feature | Global |
| Description | Modal focus trap |

**Steps:**
1. Open Create Project modal
2. Press Tab repeatedly

**Expected Result:**
- Focus stays within modal
- Close button is focusable

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Initial load: < 3 seconds
- Component drag: 60fps
- Canvas render: < 100ms for 50 components

### 6.2 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 6.3 Accessibility Compliance
- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader compatible

---

## 7. Future Enhancements (Backlog)

| Feature | Description | Priority |
|---------|-------------|----------|
| Undo/Redo | History management for edits | P2 |
| Copy/Paste | Duplicate components | P2 |
| Templates | Pre-built screen templates | P3 |
| Version Control | Git-like versioning | P3 |
| Collaboration | Multi-user editing | P3 |
| Component Library | Custom component creation | P3 |

---

## 8. Glossary

| Term | Definition |
|------|------------|
| Canvas | The visual editing area where components are placed |
| Screen | A single page/screen in the multi-screen application |
| Component | A UI element (text, button, image, etc.) placed on canvas |
| Project | The overall container for screens and components |
| PIN Evo | A PINEVO hardware device type (600x480 display) |
| Flex | A PINEVO hardware device type (480x800 display) |
| Sandbox | Test mode with mock data |
| Drag & Drop | Interaction method for adding/moving components |

---

*Document Version: 1.0*  
*Last Updated: March 18, 2026*
