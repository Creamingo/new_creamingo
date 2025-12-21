# Delivery Settings Page

A comprehensive admin interface for managing deliverable PIN codes and their delivery charges.

## Features

### 📊 Dashboard Overview
- **Statistics Cards**: Total PIN codes, active/inactive counts, and average delivery charge
- **Real-time Updates**: Statistics update automatically when data changes

### 🔍 Search & Filter
- **Search**: Find PIN codes by code or locality name
- **Status Filter**: Filter by All, Active, or Inactive PIN codes
- **Real-time Filtering**: Results update as you type

### 📋 PIN Code Management
- **Add New PIN Code**: Create new deliverable areas with custom charges
- **Edit Existing**: Modify PIN code details, charges, and status
- **Delete**: Remove PIN codes with confirmation dialog
- **Status Toggle**: Quick toggle between active/inactive states

### 📁 Bulk Operations
- **CSV Upload**: Bulk import PIN codes from CSV files
- **CSV Export**: Download current PIN codes as CSV
- **File Handling**: Automatic file selection and processing

### 📱 Mobile-First Design
- **Responsive Layout**: Works perfectly on all screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Mobile Navigation**: Optimized for mobile devices

## PIN Code Structure

Each PIN code entry includes:
- **PIN Code**: 6-digit unique identifier
- **Delivery Charge**: Numeric value in ₹ (Indian Rupees)
- **Locality**: Descriptive area name
- **Status**: Active/Inactive toggle
- **Created Date**: When the entry was added

## Validation Rules

### PIN Code
- Must be exactly 6 digits
- Must be unique (no duplicates allowed)
- Only numeric characters accepted

### Delivery Charge
- Must be a positive number
- Supports decimal values
- Displayed in ₹ (Indian Rupees)

### Locality
- Required field
- Free text input
- Trimmed of extra whitespace

## Usage Examples

### Adding a New PIN Code
1. Click "Add PIN Code" button
2. Enter 6-digit PIN code (e.g., "110001")
3. Set delivery charge (e.g., "50")
4. Enter locality (e.g., "Connaught Place, New Delhi")
5. Choose status (Active/Inactive)
6. Click "Save"

### Editing Existing PIN Code
1. Click "Edit" button in the table row
2. Modify any field in the modal
3. Click "Update" to save changes

### Bulk Operations
1. **Upload CSV**: Click "Upload CSV" → Select file → Confirm
2. **Export CSV**: Click "Export CSV" → File downloads automatically

### Search & Filter
1. **Search**: Type in search box to find by PIN code or locality
2. **Filter**: Click status buttons (All/Active/Inactive) to filter results

## Technical Implementation

### Components Used
- **React Functional Components**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built UI components
- **Lucide React**: Icon library

### State Management
- **useState**: Local component state
- **useEffect**: Side effects and data filtering
- **Form Validation**: Real-time validation with error messages

### Data Flow
1. **Mock Data**: Pre-populated with sample PIN codes
2. **State Updates**: Local state management for CRUD operations
3. **Filtering**: Real-time search and filter functionality
4. **Pagination**: Automatic pagination for large datasets

## File Structure

```
admin-panel/src/pages/DeliverySettings.tsx
├── Types & Interfaces
├── Mock Data
├── Component State
├── Form Validation
├── CRUD Operations
├── Search & Filter Logic
├── Pagination
├── Statistics Calculation
├── CSV Import/Export
└── UI Components
```

## Integration

The page is integrated into the admin panel with:
- **Routing**: `/delivery-settings` route
- **Navigation**: Added to sidebar with MapPin icon
- **Permissions**: Protected with `settings.view` permission
- **Layout**: Uses standard admin panel layout

## Future Enhancements

Potential improvements:
- **API Integration**: Connect to real backend API
- **Advanced Filters**: Date range, charge range filters
- **Bulk Edit**: Edit multiple PIN codes at once
- **Audit Trail**: Track changes and modifications
- **Geolocation**: Map integration for PIN code areas
- **Delivery Zones**: Group PIN codes into delivery zones
- **Dynamic Pricing**: Time-based or distance-based pricing

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Responsive**: Works on all screen sizes
- **Touch Support**: Full touch interaction support
