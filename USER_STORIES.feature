# Gherkin Feature Files - PINEVO CMS
# Language: en

Feature: Project Management
  As a user
  I want to create and manage PINEVO projects
  So that I can design content for specific device types

  Scenario: Create new PIN Evo project
    Given the CMS is loaded
    When I click "Create New Project" button
    And I enter project name "Test Project"
    And I select "PIN Evo" device type
    And I click "Create"
    Then the modal should close
    And the canvas should show dimensions "600x480"
    And a default screen "Screen 1" should be created

  Scenario: Create new Flex project
    Given the CMS is loaded
    When I click "Create New Project" button
    And I enter project name "Flex App"
    And I select "Flex" device type
    And I click "Create"
    Then the canvas should show dimensions "480x800"

  Scenario: Validation - Empty project name
    Given the CMS is loaded
    When I click "Create New Project" button
    And I leave project name empty
    And I select "PIN Evo" device type
    Then the "Create" button should be disabled

Feature: Multi-Screen Management
  As a user
  I want to create and manage multiple screens
  So that I can build multi-screen applications

  Scenario: Create new screen
    Given I have a project with one screen
    When I click the "+" button in TopBar
    Then a new screen "Screen 2" should be created
    And "Screen 2" should be the active screen

  Scenario: Rename screen via double-click
    Given I have a project with screen "Screen 1"
    When I double-click on the "Screen 1" tab
    And I type "Home Screen"
    And I press Enter
    Then the tab should show "Home Screen"

  Scenario: Cancel screen rename
    Given I have a project with screen "Screen 1"
    When I double-click on the "Screen 1" tab
    And I type "New Name"
    And I press Escape
    Then the tab should still show "Screen 1"

  Scenario: Delete screen
    Given I have a project with multiple screens
    When I right-click on "Screen 2" tab
    And I select "Delete"
    Then "Screen 2" should be removed
    And the previous screen should become active

  Scenario: Cannot delete last screen
    Given I have a project with only one screen
    When I right-click on "Screen 1" tab
    And I select "Delete"
    Then "Screen 1" should still exist

  Scenario: Switch between screens
    Given I have a project with multiple screens
    When I click on "Screen 2" tab
    Then "Screen 2" should become the active screen
    And the canvas should show Screen 2's components

Feature: Component Palette
  As a user
  I want to see available components in the sidebar
  So that I know what components I can add

  Scenario: View component palette
    Given the CMS is loaded with a project
    Then I should see the left sidebar with component palette
    And I should see all 6 component types: Text, Button, Image, API, Command, Audio

  Scenario: Drag component to canvas
    Given the canvas is empty
    When I drag "Text" from the palette
    And I drop it on the canvas
    Then a text component should appear at the drop position
    And the component should be selected
    And the properties panel should show text options

  Scenario: Add component via keyboard
    Given the canvas is empty
    When I tab to "Button" in the palette
    And I press Enter
    Then a button component should be added to the canvas center

  Scenario: Component tooltip on hover
    Given the component palette is visible
    When I hover over "Audio" component
    Then I should see a tooltip with description

Feature: Visual Canvas Editor
  As a user
  I want to position and arrange components on the canvas
  So that I can design my screen layout

  Scenario: Select component on canvas
    Given I have a component on the canvas
    When I click on the component
    Then the component should be highlighted as selected
    And the properties panel should show the component's properties

  Scenario: Deselect component
    Given a component is selected
    When I click on the empty canvas area
    Then no component should be selected
    And the properties panel should show empty state

  Scenario: Move component on canvas
    Given I have a component on the canvas at position (100, 100)
    When I drag the component to position (200, 150)
    Then the component should be at position (200, 150)
    And the position should persist after releasing

  Scenario: Component stays within canvas bounds
    Given I have a component on the canvas
    When I drag the component near the edge
    Then the component should not move beyond canvas boundaries

  Scenario: Delete component via button
    Given I have a component selected
    When I click the "Delete" button in properties panel
    Then the component should be removed from the canvas
    And no component should be selected

  Scenario: Delete component via keyboard
    Given I have a component selected
    When I press Delete key
    Then the component should be removed from the canvas

  Scenario: Canvas shows empty state
    Given the canvas has no components
    Then I should see "Drag components here" message
    And I should see a plus icon

Feature: Component Properties - Text
  As a user
  I want to configure text component properties
  So that I can customize text displays

  Scenario: Edit text content
    Given I have a text component selected
    When I change the Text field to "Hello World"
    Then the canvas should display "Hello World"

  Scenario: Change text font size
    Given I have a text component selected
    When I change Font Size to 24
    Then the text should appear larger on the canvas

  Scenario: Change text color
    Given I have a text component selected
    When I change Color to "#FF0000"
    Then the text should appear in red

Feature: Component Properties - Button
  As a user
  I want to configure button component properties
  So that I can create interactive buttons

  Scenario: Edit button text
    Given I have a button component selected
    When I change the Text field to "Submit"
    Then the button should display "Submit"

  Scenario: Change button background color
    Given I have a button component selected
    When I change Background to "#FF0000"
    Then the button should have red background

  Scenario: Configure button to navigate to screen
    Given I have two screens: "Home" and "Details"
    And I have a button on "Home" screen
    When I set Go To Screen to "Details"
    And I click the button in preview
    Then I should see the "Details" screen

  Scenario: Configure button with sound
    Given I have a button component selected
    And I have an audio file URL "https://example.com/sound.mp3"
    When I set Button Sound to the audio URL
    And I click the button in preview
    Then the sound should play

Feature: Component Properties - Image
  As a user
  I want to configure image component properties
  So that I can add visual media

  Scenario: Add image via URL
    Given I have an image component selected
    When I enter Image URL "https://example.com/image.jpg"
    Then the image should display on the canvas

  Scenario: Resize image component
    Given I have an image component selected
    When I change Width to 200
    And I change Height to 150
    Then the image component should be 200x150 pixels

Feature: Component Properties - Audio
  As a user
  I want to configure audio component properties
  So that I can add sound content

  Scenario: Add audio via URL
    Given I have an audio component selected
    When I enter Audio URL "https://example.com/audio.mp3"
    Then the audio component should appear on the canvas

  Scenario: Play audio from component
    Given I have an audio component with URL configured
    When I click the play button on the component
    Then the audio should play

Feature: Component Properties - API
  As a user
  I want to configure API component properties
  So that I can integrate external services

  Scenario: Configure API endpoint
    Given I have an API component selected
    When I enter API URL "https://api.example.com/data"
    And I select HTTP Method "POST"
    Then the API component should display the endpoint info

  Scenario: Configure API headers
    Given I have an API component selected
    When I enter Headers as JSON '{"Authorization": "Bearer token"}'
    Then the headers should be saved with the component

Feature: Component Properties - Command
  As a user
  I want to configure command component properties
  So that I can trigger system commands

  Scenario: Configure command
    Given I have a command component selected
    When I enter Command "echo 'Hello'"
    Then the command component should display "CMD"

Preview Feature: Preview & Simulation
  As a user
  I want to preview my screens in a device frame
  So that I can see how they look on actual hardware

  Scenario: Preview screen in device frame
    Given I have components on my screen
    When I switch to Preview mode
    Then I should see the device frame
    And all components should render in the frame

  Scenario: Preview shows correct device size - PIN Evo
    Given I have a PIN Evo project
    When I switch to Preview mode
    Then the device frame should be 600x480 pixels

  Scenario: Preview shows correct device size - Flex
    Given I have a Flex project
    When I switch to Preview mode
    Then the device frame should be 480x800 pixels

  Scenario: Test button navigation in preview
    Given I have a button configured to go to "Screen 2"
    And I am in Preview mode on "Screen 1"
    When I click the button
    Then I should see "Screen 2" in the preview

  Scenario: Play audio in preview
    Given I have an audio component with sound configured
    And I am in Preview mode
    When I click the play button
    Then the audio should play

Sandbox Feature: Sandbox Mode
  As a user
  I want to test with mock data
  So that I can simulate different scenarios

  Scenario: Enable sandbox mode
    Given sandbox mode is disabled
    When I toggle sandbox mode on
    Then the sandbox banner should show "Sandbox Mode Active"
    And the sandbox configuration panel should expand

  Scenario: Disable sandbox mode
    Given sandbox mode is enabled
    When I toggle sandbox mode off
    Then the sandbox banner should be hidden
    And the sandbox configuration panel should collapse

  Scenario: Configure sandbox carrier
    Given sandbox mode is enabled
    When I enter "DHL" in Carrier field
    Then the carrier should be saved

  Scenario: Configure all sandbox fields
    Given sandbox mode is enabled
    When I configure all sandbox fields:
      | Field | Value |
      |-------|-------|
      | Carrier | DHL |
      | Service Point | 12345 |
      | Shipment ID | ABC123 |
      | Shipment Type | Package |
      | Allocation Type | Standard |
      | Expiry | 2026-12-31 |
    Then all values should be saved

  Scenario: Reset sandbox configuration
    Given sandbox mode is enabled
    And I have configured sandbox values
    When I click "Reset" button
    Then all fields should be cleared
    And a toast should show "Sandbox configuration reset"

  Scenario: Sandbox toast notification
    Given sandbox mode is enabled
    When I configure a sandbox field
    Then a toast should confirm the configuration

Export Feature: Export & Deployment
  As a user
  I want to export my project
  So that I can save or share my work

  Scenario: Export project as JSON
    Given I have a project with screens and components
    When I click Export dropdown
    And I select "Export as JSON"
    Then a file "screens.json" should download
    And the JSON should contain all screens and components

  Scenario: Export project as HTML
    Given I have a project with screens and components
    When I click Export dropdown
    And I select "Export as HTML"
    Then a file "screens.html" should download
    And opening the HTML should show all screens

  Scenario: Deploy project button
    Given I have a project created
    When I view the TopBar
    Then I should see a "Deploy" button
    And the button should be enabled

Accessibility Feature: Accessibility
  As a user
  I want the CMS to be accessible
  So that I can use it without a mouse or screen reader

  Scenario: Skip to main content link
    Given the CMS is loaded
    When I press Tab
    Then I should see a "Skip to main content" link
    When I press Enter on the link
    Then focus should move to the main canvas area

  Scenario: Focus visible on interactive elements
    Given the CMS is loaded
    When I tab to interactive elements
    Then I should see visible focus indicators

  Scenario: Modal focus trap
    Given the Create Project modal is open
    When I press Tab repeatedly
    Then focus should stay within the modal
    And I should be able to reach the close button

  Scenario: Screen reader announces sandbox mode
    Given sandbox mode is enabled
    When the page is read by a screen reader
    Then it should announce "Sandbox Mode Active"

  Scenario: Canvas has accessible label
    Given the CMS is loaded
    When a screen reader reads the page
    Then it should announce "Component canvas - drag and drop area"

  Scenario: Component palette keyboard accessible
    Given the CMS is loaded
    When I tab to the component palette
    Then I should be able to navigate through components
    And Enter should add the component to canvas
