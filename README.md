# SalesTrack
A comprehensive sales tracking and CRM application designed for sales executives. Features a modern, glassy UI and AI-powered automation for seamless daily operations.

## Features Integrated

### 1. Dashboard & Performance Tracking
- **Real-Time Metrics**: Tracks daily, weekly, and monthly sales performance against set targets.
- **MTD Progress**: Visual progress bar for Month-to-Date (MTD) achievements.
- **End of Day (EOD) Reporting**: Dedicated modal to log EOD metrics (achievement, EOL achievement, day/week/EOL targets).
- **Calendar & List Views**: Toggle between a calendar heatmap and a list view of daily entries.
- **One-Click Report Copy**: Instantly copy daily summarized reports (generated via WhatsApp-friendly text format) to clipboard.

### 2. Smart Sales Entry (New Entry)
- **Manual Entry**: Dynamic forms allowing users to add multiple products in a single bill, specifying quantity and either unit price or total price.
- **AI Bill Scanner**: Integrated with Gemini AI to scan uploaded bill images and auto-extract product details, quantities, prices, and customer information.
- **Image Compression**: Client-side image compression before converting to Base64 to save storage.
- **Geyser Auto-Routing**: Automatically detects 'Geyser' or 'Water Heater' installations from bills and routes them to the CRM as pending complaints/installations.

### 3. CRM & Customer Management
- **Complaints & Installations**: Track customer issues or new installations. Statuses include: Raised, In progress, Technician assigned, Resolved.
- **Timeline Tracking**: Add timeline notes for each complaint status update.
- **Follow-ups**: Schedule and track customer follow-up reminders.

### 4. Attendance & Location Check-in
- **Geo-tagged Check-in**: Uses browser geolocation and Leaflet Maps to verify and log store location during daily attendance check-in.
- **Status Logging**: Mark attendance as Present, Week Off, or Leave.

### 5. Settings & Profile
- **Personalization**: Upload an avatar, set store name, employee ID, and contact details.
- **Target Configuration**: Set custom daily, weekly, and monthly monetary goals.
- **Theme Customization**: Full Light/Dark mode support with fluid transitions.
- **Data Management**: 
  - **Full Backup/Restore**: Export and import complete application state via JSON files.
  - **PDF Export**: Generate detailed printable reports with attached bill images.
  - **Excel Export**: Detailed month-wise breakdown of sales data.

## Data Models (from `types.ts`)

- **SaleItem**: Tracks `id`, `productName`, `quantity`, `price`, `customerPhone`, `billId`, `txnNumber`.
- **DailyReport**: Groups sales by `date`. Includes `items`, `totalValue`, `totalQty`, `billImages` (Base64), `notes`, and `isWeekOff`.
- **StoreEODEntry**: Tracks end-of-day stats (`date`, `achievement`, `eolAchieve`, `dayTarget`, `weekTarget`, `eolTarget`).
- **StoreLocation**: Tracks `lat`, `lng`, and `address`.
- **AttendanceEntry**: Tracks `date`, `status`, `checkInTime`, and `location`.
- **UserProfile**: Includes `name`, `employeeId`, `phoneNumber`, `storeName`, `monthlyTarget`, `avatar` (Base64), `apiKey` (Gemini), `storeLocation`, `customTargets`.
- **Complaint**: Tracks customer installation/repair requests with a `status` and `timeline`.
- **FollowUp**: Tracks reminders (`reminderDate`, `note`, `isCompleted`).

## Design Details

- **Tailwind CSS**: Utility-first styling for responsive design.
- **Glassmorphism**: UI relies heavily on frosted glass effects (`backdrop-blur`, semi-transparent backgrounds).
- **Reusable UI Components**: `GlassCard`, `GlassInput`, `GlassButton`, and `Modal` ensure consistent aesthetics across both Light and Dark themes.
- **Responsive Navigation**: Bottom navigation bar optimized for mobile interfaces with active state indicators and scaling animations.
- **Icons**: Lucide React icons are used extensively to provide a clean, modern look.
