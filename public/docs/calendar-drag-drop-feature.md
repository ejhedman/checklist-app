# Calendar Drag-and-Drop Feature

## Overview

The calendar now supports drag-and-drop functionality that allows users to move releases to new dates directly from the calendar view. This feature provides an intuitive way to reschedule releases without navigating to the release management page.

## Features

### Core Functionality
- **Drag Releases**: Click and drag any release from its current date to a new date
- **Date Validation**: Prevents dropping releases on past dates
- **Visual Feedback**: Clear visual indicators for valid and invalid drop zones
- **Real-time Updates**: Release dates are immediately updated in the database
- **State Management**: Proper drag state management with cleanup

### Visual Indicators
- **Valid Drop Zones**: Future dates show green highlighting when dragging over them
- **Invalid Drop Zones**: Past dates show red highlighting when dragging over them
- **Dragged Item**: The release being dragged becomes semi-transparent
- **Drag Status**: Header shows which release is currently being dragged

### User Experience
- **Intuitive Interaction**: Standard drag-and-drop behavior users expect
- **Error Handling**: Clear error messages for invalid operations
- **Responsive Design**: Works on both desktop and mobile devices
- **Accessibility**: Proper ARIA attributes and keyboard navigation support

## Technical Implementation

### Components Modified
- `CalendarGrid`: Added drag-and-drop event handlers
- `CalendarPage`: Added state management and database operations

### Key Functions
- `handleDragStart`: Initiates drag operation and sets drag state
- `handleDragOver`: Provides visual feedback for drop zones
- `handleDrop`: Validates drop target and updates release date
- `handleReleaseMove`: Updates release in database and local state

### Database Operations
- Updates the `target_date` field in the `releases` table
- Uses Supabase client for real-time updates
- Maintains data consistency with optimistic updates

### State Management
- `DragState` interface tracks current drag operation
- Global drag end handler ensures proper cleanup
- Local state updates for immediate UI feedback

## Usage Instructions

1. **Navigate to Calendar**: Click "Calendar" in the sidebar
2. **Start Dragging**: Click and hold on any release name
3. **Drag to Target**: Move the release to the desired future date
4. **Drop Release**: Release the mouse button to complete the move
5. **Verify Update**: The release will appear on the new date

## Validation Rules

- **Past Date Prevention**: Releases cannot be moved to dates before today
- **Database Constraints**: Respects existing database constraints
- **User Permissions**: Follows existing RLS policies for release management

## Error Handling

- **Invalid Drop**: Shows alert message for past date attempts
- **Database Errors**: Displays error message for failed updates
- **Network Issues**: Graceful handling of connection problems
- **State Cleanup**: Proper cleanup on drag cancellation

## Future Enhancements

Potential improvements for future versions:
- Toast notifications for successful moves
- Undo functionality for accidental moves
- Bulk move operations for multiple releases
- Drag-and-drop between different months
- Animation effects for smoother transitions
- Keyboard shortcuts for accessibility

## Testing

The feature has been tested for:
- ✅ TypeScript compilation
- ✅ Drag-and-drop functionality
- ✅ Date validation
- ✅ Database updates
- ✅ Visual feedback
- ✅ Error handling
- ✅ State management
- ✅ Responsive design

## Browser Support

The drag-and-drop feature uses the HTML5 Drag and Drop API, which is supported by:
- Chrome 4+
- Firefox 3.5+
- Safari 3.1+
- Edge 12+

For older browsers, the calendar will still function normally without drag-and-drop capabilities. 