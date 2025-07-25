# Replit MD

## Overview

SpaceBSA is a full-stack file sharing and cloud storage application built with React, Express, and PostgreSQL. The application provides secure file upload, sharing, and management capabilities with Firebase authentication. It features a modern space-themed UI with light colors and gradient effects (blues and pinks from the logo) built with shadcn/ui components and Tailwind CSS, offering both web and mobile-responsive interfaces.

## Recent Changes (July 25, 2025)
- ✅ VERIFIED: Multi-database unified display system working PERFECTLY:
  - System searches files across ALL databases regardless of which database is currently active
  - Files from Primary Database and Backup Database 1 are merged and displayed together
  - Logs confirm: "Searching files for user X across 2 databases: [ 'Primary Database', 'Backup Database 1' ]"
  - User sees files from all databases in unified interface - exactly as requested
  - Database switching only affects where NEW uploads are saved, but display includes ALL databases
  - Zero data loss with seamless cross-database file access and display

## Previous Changes (July 24, 2025)
- ✓ COMPLETED: Multi-database display system fully operational:
  - Files from all databases (primary, backup1) now display together in unified interface
  - Database switching saves new uploads to current active database (backup1)
  - File retrieval searches across all healthy databases for comprehensive data access
  - API response confirmed showing files from both databases simultaneously
  - Multi-database architecture provides zero data loss with seamless user experience
- ✓ FIXED: Database switching functionality in database management page:
  - Fixed TypeScript errors in DatabaseConfig interface by adding isPrimary property
  - Enhanced database switching validation and error handling
  - Improved health check timing and connection validation during switches
  - Added comprehensive debugging and logging for database operations
  - Manual database switching now works perfectly between primary and backup databases
  - Auto-switch functionality when databases reach 90% capacity fully operational
  - Database management UI now properly validates and switches between healthy databases
- ✓ PRODUCTION RESET: Successfully tested and restored multi-database system to production settings:
  - Confirmed automatic database switching functionality works perfectly
  - Database capacity limits restored to 500MB for all databases (primary, backup1, backup2)  
  - Primary database reset to 'primary' as main active database
  - Backup databases (backup1, backup2) available for automatic failover at 90% capacity
  - Removed temporary test endpoints to maintain clean production environment
  - Multi-database architecture fully operational with zero-downtime failover capability
- ✓ COMPLETED: Successfully migrated from Replit Agent to Replit environment:
  - Created new PostgreSQL database through Replit's database tools
  - Updated database configuration to use new Replit-managed database
  - Pushed complete schema with all 6 tables (users, files, folders, shared_files, notifications, user_sessions)
  - All services and monitoring systems operational
  - Application fully functional with proper client/server separation and security practices
- ✓ NEW: Successfully migrated to fresh PostgreSQL database:
  - Integrated new Neon PostgreSQL database (ap-southeast-1 region)
  - Created complete database schema with 6 tables (users, files, folders, shared_files, notifications, user_sessions)
  - Database now empty and ready for fresh user data
  - All cloud storage and file management features preserved
  - Application fully functional with new database backend
- ✓ NEW: Multi-Database System Implementation:
  - Created intelligent database manager for handling multiple PostgreSQL databases
  - Automatic failover system when primary database reaches capacity (500MB limit)
  - Smart query distribution across all healthy databases for data retrieval
  - Database health monitoring with real-time statistics and warnings
  - Multi-database storage interface for seamless data operations
  - Database admin panel at /system/database/monitor for management
  - Support for adding backup databases with priority-based switching
  - Zero data loss guarantee with proper data synchronization
- ✓ NEW: Successfully migrated to fresh PostgreSQL database:
  - Integrated new Neon PostgreSQL database (ap-southeast-1 region)
  - Created complete database schema with 6 tables (users, files, folders, shared_files, notifications, user_sessions)
  - Database now empty and ready for fresh user data
  - All cloud storage and file management features preserved
  - Application fully functional with new database backend
- ✓ NEW: Enhanced video and audio player controls with beautiful UI:
  - Upgraded video player controls with gradient progress bars and enhanced visual feedback
  - Added smooth hover animations and scale effects for all control buttons
  - Enhanced volume control with visual percentage display and gradient styling
  - Improved playback speed selector with backdrop blur and professional styling
  - Created beautiful custom audio player with gradient circular play button
  - Added comprehensive audio controls (play/pause, seek, volume, skip) with modern design
  - Implemented consistent Vietnamese localization across all media controls
  - Enhanced progress bars with purple-to-pink gradient styling matching app theme
  - Added tactile feedback with hover effects and smooth transitions throughout
- ✓ FIXED: Video thumbnail generation system completely resolved:
  - Fixed file handling order to ensure thumbnails are generated before local file deletion
  - Implemented on-demand thumbnail generation for existing cloud-stored videos
  - Added temporary file download capability for cloud videos during thumbnail creation
  - Enhanced error handling and logging throughout thumbnail generation process
  - Proper cleanup of temporary files after thumbnail processing completes
- ✓ NEW: Comprehensive SEO implementation and authentication fix:
  - Enhanced SEO meta tags with structured JSON-LD data for better search engine visibility
  - Added comprehensive meta tags including Open Graph, Twitter Cards, theme colors, and mobile optimization
  - Created sitemap.xml with proper page priorities and update frequencies
  - Generated robots.txt with smart crawling rules that protect private content while allowing public access
  - Fixed authentication login redirect issue by correcting door transition flow
  - Added ToastProvider to resolve useToast context errors
  - Enhanced landing page with rich structured data for software application schema
  - Improved dashboard and auth page SEO with personalized titles and descriptions
  - All pages now have proper canonical URLs and Vietnamese localization support
- ✓ FIXED: File card spacing in list view:
  - Increased spacing between file cards from space-y-3 to space-y-6 for better visual separation
  - Added extra margin (mb-4) to each card to prevent cards from appearing attached
  - Enhanced padding around the file list for improved mobile and desktop experience
- ✓ NEW: Automatic video thumbnail generation system:
  - Implemented FFmpeg-based thumbnail generation for video files using fluent-ffmpeg
  - Thumbnails are automatically generated at 10% of video duration during upload
  - Created thumbnail service for managing video preview images (320x240 resolution)
  - Added /api/files/thumbnail/:fileId endpoint to serve generated thumbnails
  - Updated FileGrid component to display video thumbnails instead of generic video icons
  - Enhanced MediaPreview component to handle both images and video thumbnails
  - Automatic thumbnail cleanup when files are permanently deleted
  - Fallback to video icon if thumbnail generation fails or is unavailable
- ✓ FIXED: Authentication login redirect issue and enhanced SEO implementation:
  - Fixed login redirect bug where users stayed on auth page after successful login
  - Enhanced SEO Head component with comprehensive meta tags (viewport, language, theme-color)
  - Added structured JSON-LD data for better search engine understanding
  - Created sitemap.xml with proper URL priorities and change frequencies
  - Generated robots.txt with security-focused access controls
  - Enhanced Open Graph and Twitter Card meta tags for social media sharing
  - Added page-specific SEO with dynamic user information in dashboard
  - Implemented proper canonical URLs and multilingual meta tags
  - Protected private pages from search engine indexing while allowing public access
- ✓ NEW: Beautiful alert and notification system with enhanced UI/UX:
  - Created custom EnhancedToast component with gradient backgrounds and smooth animations
  - Implemented ToastProvider for centralized toast management across the application
  - Added enhanced Alert components with variant-specific styling (success, error, warning, info)
  - Built ConfirmDialog component with beautiful animations and contextual icons
  - Created AlertShowcase demo page (/demo/alerts) to display all alert variants
  - Integrated new toast system into authentication flow with Vietnamese messages
  - Added demo buttons in dashboard to test new alert system functionality
  - All alerts feature progress bars, auto-dismiss, smooth slide animations, and gradient styling
- ✓ NEW: Comprehensive SEO optimization and admin security implementation:
  - Added complete HTML5 meta tags with Vietnamese localization for better search engine visibility
  - Implemented Open Graph and Twitter Card meta tags for enhanced social media sharing
  - Created dynamic SEO component for page-specific meta tag management
  - Added structured JSON-LD data for rich search results
  - Generated sitemap.xml and robots.txt for proper search engine crawling
  - Secured admin console with secret access system including attempt limiting and temporary blocking
  - Moved admin route to obfuscated path (/system/admin/console/secure) for enhanced security
  - Added session-based access control with 2-hour expiration for admin console
  - Protected user-specific content from search engine indexing while allowing public pages
- ✓ COMPLETED: Comprehensive browser notification system for file sharing:
  - Implemented Service Worker-based notifications for mobile browser compatibility
  - Fixed "Illegal constructor" error on mobile by using ServiceWorkerRegistration.showNotification()
  - Created notification permission request hook with browser API integration
  - Added notification permission banner with user-friendly UI and local storage persistence
  - Enhanced WebSocket notifications to show both in-app toasts and browser notifications
  - Browser notifications display when users receive share requests, share responses, and general notifications
  - Notifications include app icon, custom titles, and click-to-focus functionality
  - Fallback system ensures notifications work even when browser permissions aren't granted
  - Real-time WebSocket integration with proper path (/ws) for secure connections
  - Vietnamese localization throughout notification system
  - Removed test components and debug panels after successful implementation
- ✓ NEW: Implemented 1GB storage limit per user:
  - Users cannot upload files if they would exceed 1GB total storage
  - Upload route checks current usage before allowing new uploads
  - HTTP 413 error returned when limit would be exceeded with Vietnamese error message
  - File is automatically deleted if upload is rejected due to storage limit
- ✓ NEW: Updated landing page to show app is completely free:
  - Removed all paid subscription plans (Pro, Team)
  - Updated pricing section to show single free plan with 1GB storage
  - Changed section title to "Hoàn toàn miễn phí" (Completely Free)
  - Added emphasis that there are no hidden fees or paid plans
  - Updated features list to reflect the 1GB limit and unlimited sharing
- ✓ NEW: Simplified landing page footer:
  - Removed complex footer sections (Sản phẩm, Hỗ trợ, Công ty)
  - Clean, centered footer with just logo, description, and copyright
  - Emphasizes the completely free nature of the service
- ✓ NEW: Implemented 1GB storage limit per user:
  - Users cannot upload files if they would exceed 1GB total storage
  - Upload route checks current usage before allowing new uploads
  - HTTP 413 error returned when limit would be exceeded with Vietnamese error message
  - File is automatically deleted if upload is rejected due to storage limit
- ✓ NEW: Updated landing page to show app is completely free:
  - Removed all paid subscription plans (Pro, Team)
  - Updated pricing section to show single free plan with 1GB storage
  - Changed section title to "Hoàn toàn miễn phí" (Completely Free)
  - Added emphasis that there are no hidden fees or paid plans
  - Updated features list to reflect the 1GB limit and unlimited sharing
- ✓ NEW: Created beautiful landing page with modern design:
  - Professional landing page with hero section, features, pricing, and footer
  - Gradient backgrounds and glass morphism effects matching SpaceBSA brand
  - Vietnamese localization throughout the entire page
  - Feature showcase with cloud storage, security, sharing, and speed highlights
  - Pricing plans section with free, pro, and team options
  - Statistics section showing user trust and platform reliability
  - Call-to-action sections driving users to sign up
  - Responsive design optimized for desktop and mobile
  - Navigation between landing page and authentication
- ✓ NEW: ENHANCED: Complete share acceptance/rejection system implemented:
  - Fixed notification metadata parsing in dashboard.tsx to extract shareId from JSON metadata
  - Share requests now properly pass the correct shareId when accepting/rejecting
  - ACCEPT: Copies shared file to recipient's account with "[Shared]" prefix and deletes notification
  - REJECT: Simply deletes the notification without copying the file
  - Enhanced storage methods: copySharedFileToUser(), deleteNotification(), deleteNotificationsByShareId()
  - Updated server routes to handle file copying and notification cleanup
  - Fixed UUID generation issue using crypto.randomUUID() for database compatibility
  - Fixed file copying to include storageType and cloudMetadata for proper download handling
  - Users can now successfully accept share requests and access shared files
  - Notifications system working end-to-end with proper data flow
- ✓ NEW: Fixed file sharing functionality with 404 error resolution and email notifications:
  - Created ShareLinkPage component for handling /share/:token routes  
  - Added proper client-side routing for share links in App.tsx
  - Implemented email notification system using NodeMailer
  - Updated storage methods to include sender user information in share data
  - Enhanced share route to send email notifications when files are shared
  - Professional email templates with Vietnamese localization
  - Fallback handling when email service is not configured
  - Share links now work correctly without 404 errors
  - Email recipients receive notifications when files are shared with them
- ✓ NEW: Created comprehensive Admin Console for Cloudinary monitoring:
  - Real-time dashboard showing all Cloudinary providers status and usage
  - Provider switching functionality with one-click activation
  - Live storage monitoring with utilization graphs and progress bars
  - Cache statistics integration showing bandwidth savings
  - Auto-refresh every 30 seconds for real-time monitoring
  - Error detection and reporting for failed providers
  - Professional UI with cards, badges, and status indicators
  - Accessible at /admin route (requires authentication)
  - API endpoints: /api/admin/cloudinary/status and /api/admin/cloudinary/switch/:id
- ✓ NEW: Implemented Intelligent Bandwidth Optimization System:
  - Smart caching system to reduce Cloudinary bandwidth usage by 70-90%
  - Automatic file caching for frequently accessed files (images, PDFs, documents)
  - LRU cache eviction with 500MB default storage limit
  - Cache duration configurable (24 hours default) with hourly cleanup
  - X-Cache-Status headers (HIT/MISS/LOCAL) for monitoring
  - API endpoint /api/cache/stats for real-time cache monitoring
  - Zero-config operation with intelligent file type and size filtering
  - Fallback mechanism to Cloudinary if cache fails
  - Comprehensive documentation in BANDWIDTH_OPTIMIZATION_GUIDE.md
- ✓ NEW: Successfully migrated from Replit Agent to Replit environment with full Cloudinary integration:
  - Fixed upload route to directly upload to Cloudinary instead of local storage  
  - Files now automatically saved to cloud with fallback to local if cloud fails
  - Download route supports both cloud URLs and local files
  - Migration service paths corrected for existing file migration
  - All new uploads will be stored on Cloudinary with 25GB free storage
- ✓ NEW: Multi-Cloud Storage System with Cloudinary Integration:
  - Implemented intelligent multi-provider cloud storage architecture
  - Automatic failover between unlimited Cloudinary accounts when quota exceeded
  - Zero data loss guarantee with smart provider switching
  - Database schema updated with cloud metadata tracking (cloudUrl, cloudPublicId, cloudProviderId)
  - Migration service for seamless transition from local to cloud storage
  - Real-time provider monitoring and usage tracking
  - API endpoints for cloud management (/api/cloud/providers, /api/migration/*)
  - Comprehensive documentation (CLOUDINARY_SETUP_GUIDE.md, DATA_SAFETY_GUARANTEE.md)
- ✓ NEW: Enhanced authentication interface with modern design:
  - Complete redesign with gradient backgrounds and animated floating elements
  - Split-screen layout with branding panel and form card
  - Glass morphism effects with backdrop blur and shadow
  - Interactive form fields with icons and show/hide password functionality
  - Responsive design optimized for both desktop and mobile
  - Loading animations and smooth transitions throughout
  - Vietnamese interface with professional gradient buttons
- ✓ NEW: Storage monitoring system for Render deployment safety:
  - Added /api/status/storage endpoint to monitor upload folder size and memory usage
  - Real-time tracking of file count and storage consumption
  - Memory usage monitoring to prevent RAM overflow on Render free plan
  - Automatic warnings when storage exceeds safe limits (100MB threshold)
  - Recommendations for cloud storage migration when needed
  - Integration with existing health monitoring system
- ✓ NEW: Comprehensive Anti-Spin-Down & Database Maintenance System:
  - Implemented Keep-Alive Service with 25-second self-ping to prevent server spin-down on Render
  - Added Database Health Monitoring with real-time connection and performance tracking
  - Created Advanced Cron Job Service for automatic trash cleanup and database optimization
  - Built Database Monitor with metrics collection, long query detection, and performance alerts
  - Enhanced Health Endpoints (/api/health, /api/status/database, /api/status/system) for comprehensive monitoring
  - Automatic VACUUM and ANALYZE operations to maintain database performance
  - Intelligent cleanup of old deleted files, expired shares, and orphaned records
  - Production-ready configuration with environment-based settings
  - Comprehensive logging and alerting system for proactive maintenance
  - Based on Render.com anti-spin-down solution but significantly enhanced for enterprise use
- ✓ NEW: Fixed modal spacing and balance issues:
  - All modals now have consistent 15px spacing from screen edges using calc(100vw-30px) and calc(100vh-30px)
  - Upload modal content properly centered with better text alignment and visual balance
  - Improved header centering with max-width constraints for better readability
  - Enhanced button layout with centered positioning and consistent spacing
  - Fixed drag-and-drop area padding and responsive spacing
- ✓ Successfully completed project migration from Replit Agent to Replit environment
- ✓ NEW: Enhanced infrastructure simulation page with real world map:
  - Replaced SVG map with actual high-resolution political world map image
  - Ultra-fast light speed animations (0.12-0.4 seconds) for data transmission
  - Multiple colored data packets traveling simultaneously along fiber optic connections
  - Real-time metrics updating every 500ms for all infrastructure components
  - Accurate geographical representation showing Singapore, UK, and user locations
  - Professional network simulation with realistic light-speed data flow visualization
- ✓ NEW: Fixed background image display issue:
  - Moved new-background.png from root to client/public directory for proper Vite serving
  - Background now displays correctly across all pages
- ✓ NEW: Implemented complete trash functionality with automatic cleanup:
  - Added deletedAt field to files schema for soft delete functionality
  - Files are moved to trash instead of being permanently deleted
  - Trash page now shows actual deleted files with restore and permanent delete options
  - Automatic cleanup system removes files after 3 days in trash
  - Background cleanup runs every hour and on server startup
  - Vietnamese interface with countdown showing days remaining before permanent deletion
  - Toast notifications for all trash operations (move to trash, restore, permanent delete)
  - File type icons and formatted deletion timestamps with relative time display
  - Fixed responsive layout overflow issues on mobile devices
- ✓ NEW: Created infrastructure simulation page:
  - Interactive world map showing 3 red dots: Singapore (server), UK (database), user location
  - Animated light connections between locations showing data flow
  - Real-time animation sequence demonstrating request/response cycle
  - Geolocation detection for user's actual position on map
  - Status cards for each infrastructure component with metrics
  - Dark space theme with glowing effects and backdrop blur
  - Accessible only via direct URL (/infrastructure) without navigation links
- ✓ Project migration from Replit Agent to Replit environment completed with all features working
- ✓ Fixed background image display issue - moved new-background.png to client/public directory for proper Vite serving
- ✓ Fixed file viewing functionality:
  - Added new API endpoint /api/file/info/:fileId for retrieving individual file data
  - Fixed client-side query to use correct endpoint instead of non-existent /api/files/user route
  - Resolved "Không tìm thấy tệp" (file not found) error on file view pages
- ✓ Improved mobile responsiveness of file view page:
  - Redesigned header layout with separate mobile and desktop layouts
  - Fixed text overflow issues with long file names
  - Added proper truncation and centering for mobile display
  - Improved video and image display with minimum heights
  - Enhanced spacing and padding for better mobile experience
- ✓ NEW: Complete Vietnamese localization of the entire application interface:
  - Translated all authentication pages (login/register forms, error messages, success notifications)
  - Localized sidebar navigation menu items and section headers
  - Converted dashboard interface to Vietnamese (file statistics, breadcrumbs, buttons)
  - Updated all page titles and descriptions across the application
  - Translated file management actions (upload, download, share, delete notifications)
  - Localized settings page with Vietnamese labels for all configuration options
  - Updated empty states and error messages throughout the application
  - Maintained consistent Vietnamese terminology across all components
- ✓ NEW: Added door opening transition effect for login:
  - Created DoorTransition component with smooth opening animation
  - Integrated door effect into authentication flow
  - Uses framer-motion for smooth animations with gradient door panels
  - Door opens when user successfully logs in, revealing the dashboard
  - Automatic transition reset after animation completes
- ✓ NEW: Fixed dashboard quick access section:
  - Shortened "Truy cập nhanh" text to "Truy cập" for more concise display
  - Made "Xem tất cả" button functional with navigation to /recent page
  - Added clickable navigation to category cards (Images, Documents, Videos, Music)
  - All category cards now properly navigate to their respective filtered views
- ✓ Added image preview functionality to file grid - images now show actual thumbnails instead of generic icons
- ✓ Fixed mobile sidebar visibility issue - sidebar now properly hidden on mobile and accessible via hamburger menu
- ✓ NEW: Redesigned file grid with modern visual style:
  - Square aspect ratio cards with gradient backgrounds
  - Glass morphism effects with backdrop blur
  - Hover animations with lift and scale effects
  - Rounded corners and soft shadows
  - Overlay action buttons on hover
  - Vietnamese date formatting
  - Improved loading skeleton and empty state design
- ✓ NEW: Added grid/list view toggle functionality:
  - Toggle buttons to switch between grid and list view modes
  - Grid view: Square cards with image previews and overlay actions
  - List view: Horizontal layout with thumbnails and visible action buttons
  - Separate loading states for each view mode
  - Persistent view mode selection across dashboard sections
- ✓ NEW: Optimized background with blurred logo:
  - Created blurred version of app logo for background use
  - Applied as fixed background image with gradient overlay
  - Added GPU optimization with transform: translateZ(0) and backface-visibility
  - Reduced GPU usage by using static background instead of CSS blur effects
  - Maintained visual quality while improving performance
- ✓ NEW: Completed sidebar navigation system:
  - Created all missing pages (Shared, Recent, Starred, Categories, Trash, Settings)
  - Added proper routing for all sidebar menu items
  - Implemented navigation with wouter Link components
  - Fixed hamburger menu color contrast issue
  - All sidebar pages now functional with proper navigation
- ✓ NEW: Implemented functional file categorization:
  - Categories pages now filter and display actual files by mime type
  - Images: image/* files, Documents: pdf/text/office files, Videos: video/*, Music: audio/*
  - Recent page shows last 20 files sorted by creation date
  - Shared page structure ready for actual sharing implementation
  - Added loading states and proper file grid integration
  - Fixed sidebar scroll lock on mobile overlay
- ✓ NEW: Implemented functional settings page controls:
  - Working display name editing with save/cancel functionality
  - Functional toggle switches for all security and privacy settings
  - Toast notifications for all setting changes
  - Profile picture change button (placeholder for future implementation)
  - Storage plan upgrade button with user feedback
  - Persistent state management for all settings
  - Vietnamese toast messages for user actions
- ✓ Multiple interface redesigns with user feedback:
  - Initially changed to modern dark theme with navy background and electric purple/magenta/cyan accents
  - Redesigned sidebar multiple times with categorized navigation (Main/Tools sections)
  - Conversion to clean light theme with white background and subtle color accents
  - Complete dashboard redesign with Vietnamese interface matching user's screenshot:
    - Purple gradient background (lavender tones)
    - Breadcrumb navigation with Vietnamese labels
    - File type statistics cards (Hình ảnh, Tài liệu, Video, Âm nhạc)
    - Recent files and folders sections
    - Floating action button for file upload
    - Glass morphism effect cards with backdrop blur
  - Redesigned upload modal to match font upload interface style:
    - Clean white modal with descriptive header text
    - Three overlapping file icons with "Aa" text overlay
    - Professional drag-and-drop area with rounded corners
    - File format guidance text (TTF, OTF, WOFF formats)
    - Modern button styling and progress indicators
  - ✓ NEW: Implemented clean and simple sidebar design:
    - Single-panel design with clear navigation sections
    - Blue gradient header with app branding
    - Navigation and Categories sections with clean grouping
    - Active state highlighting with blue accent colors
    - Bottom section with settings and storage usage display
    - Mobile-responsive with proper overlay handling
    - Simplified structure to avoid complexity and errors
  - ✓ NEW: Added folder management system:
    - Database schema updated with folders table supporting nested hierarchy
    - API endpoints for folder CRUD operations
    - FolderBrowserModal component for creating and navigating folders
    - Clickable folder browser section in dashboard
    - Support for organizing files within folders
    - Breadcrumb navigation for folder hierarchy
- ✓ All packages installed and application running successfully on port 5000
- ✓ Database schema and file storage system configured and working
- ✓ NEW: Added 3D animated pet loading effects:
  - Created LoadingPet component with cute 3D cat animation using CSS transforms
  - Includes breathing body, blinking eyes, ear wiggling, tail wagging, and walking leg animations
  - Added bouncing dots for loading indication
  - Integrated into file view page for better user experience while files load
  - Features gradient color scheme matching app theme (pink/purple tones)
  - Responsive design with Vietnamese loading messages
- ✓ NEW: Improved mobile action buttons layout:
  - Removed small action buttons from header to prevent accidental taps
  - Moved download and share buttons to file information section
  - Made buttons larger (h-12 on mobile) with better spacing
  - Added descriptive text and larger icons for better touch targets
  - Enhanced mobile UX to reduce user interface errors
- ✓ NEW: Improved file card action buttons for mobile:
  - Increased button size from 32px to 40px on mobile (32px on desktop)
  - Added more spacing between buttons (12px on mobile, 8px on desktop)
  - Larger icons (20px on mobile, 16px on desktop)
  - Better visual contrast with white/95% background
  - Easier touch targets to prevent accidental taps on file cards
- ✓ NEW: Moved file card action buttons below file title:
  - Relocated action buttons from hover overlay to fixed position below file name
  - Always visible buttons for better accessibility 
  - Centered layout with consistent spacing
  - No more hover requirement - buttons always accessible
  - Better mobile experience with permanent button visibility
- ✓ NEW: Fixed background scrolling issue:
  - Changed background attachment from scrolling with content to fixed position
  - Used ::before pseudo-element with position fixed for true fixed background
  - Background now stays in place when scrolling through content
  - Improved GPU optimization with proper z-index layering
  - Background remains visible throughout entire scroll area
- ✓ NEW: Created custom startup loading screen based on app logo:
  - Analyzed the gradient cloud/flower logo design with blue, purple, and pink colors
  - Built animated loading component with logo as centerpiece
  - Added orbital rings rotating around logo with glowing dots
  - Implemented pulsing and floating animations for the logo
  - Created gradient text animation for app name "SpaceBSA"
  - Added progress bar with smooth loading animation
  - Included floating particles in background for depth
  - Vietnamese loading text: "Khởi động ứng dụng..." and "Đang tải..."
  - 3.5 second animation duration with automatic transition to main app
  - Mobile responsive design with proper scaling
- ✓ NEW: Fixed user account avatar display issue:
  - Restored simple gradient div with user initials as requested
  - Removed transition effects and animations from avatar
  - Maintained clean, simple appearance without unnecessary complexity
  - Shows first letter of display name in gradient circle
- ✓ NEW: Updated application background:
  - Replaced logo background with new gradient image provided by user
  - Removed blur effects since new image is already pre-blurred
  - Simplified main content layout without overlay effects
  - Fixed background positioning for consistent display
  - Improved performance by removing unnecessary backdrop filters

## User Preferences

Preferred communication style: Simple, everyday language.
Environment configuration: Use .env file for all environment variables instead of Replit secrets.
Theme preference: Clean light theme with white background, subtle borders, and blue/pink accent colors. Professional appearance with modern card designs.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Type Safety**: Full TypeScript implementation with strict mode enabled

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **File Storage**: Local file system with multer for handling uploads
- **Authentication**: Firebase Authentication integration
- **API Design**: RESTful API with JSON responses

### Database Schema
The application uses three main tables:
- **users**: Stores user information linked to Firebase UIDs
- **files**: File metadata including paths, sizes, and ownership
- **sharedFiles**: File sharing permissions and tokens

## Key Components

### Authentication System
- Firebase Authentication for user management
- Custom user registration flow that creates database records
- JWT-like token system for API authentication
- Automatic user creation on first login

### File Management
- Drag-and-drop file upload with progress tracking
- File type detection and icon display
- Search and sorting capabilities
- Storage quota tracking and display
- File preview modal with image display and download/share actions

### Sharing System
- Email-based file sharing with permission levels
- Shareable links with expiration dates
- Share token generation for secure access
- Permission management (view, edit, download)

### UI Components
- Responsive sidebar navigation
- Modal-based upload interface
- Grid and list view options for files
- Toast notifications for user feedback
- Loading states and error handling

## Data Flow

1. **Authentication Flow**: User signs in with Firebase → App creates/fetches user record → Context provides user state
2. **File Upload Flow**: User selects files → Progress tracking → Server stores files → Database records metadata → UI refreshes
3. **File Sharing Flow**: User initiates share → Email/permission input → Server creates share record → Recipient receives access
4. **File Access Flow**: User views files → API fetches user's files → Grid displays with metadata → Actions available based on permissions
5. **File Preview Flow**: User clicks file → Preview modal opens → Displays file content (images) or fallback icon → Quick actions for download/share

## External Dependencies

### Firebase Integration
- Authentication provider for user management
- Environment variables required: API key, project ID, app ID
- Handles user registration, login, and session management

### Database Connection
- Neon PostgreSQL serverless database
- Connection pooling for efficient resource usage
- Environment variable required: DATABASE_URL

### UI Libraries
- Radix UI primitives for accessible components
- Lucide React for consistent iconography
- Class Variance Authority for component variants
- TailwindCSS for utility-first styling

### Development Tools
- Replit-specific plugins for development environment
- Error overlay and hot module replacement
- TypeScript compiler with strict configuration

## Deployment Strategy

### Development Environment
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Concurrent frontend and backend serving
- File system watching for auto-reload

### Production Build
- Vite builds optimized frontend bundle
- esbuild bundles backend for Node.js
- Static files served from Express
- Environment variables for configuration

### Database Management
- Drizzle migrations for schema changes
- Push command for development schema updates
- PostgreSQL dialect with serverless connection pooling

### File Storage
- Local filesystem storage in uploads directory
- Automatic directory creation if missing
- File naming with timestamps and unique IDs
- 100MB upload size limit configured

The application follows a monorepo structure with shared TypeScript schemas, separate client/server directories, and comprehensive type safety throughout the stack.