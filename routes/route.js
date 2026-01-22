const express = require('express');
const route = express.Router();

// Middleware
const requireAuth = require('../middleware/requireAuth');
const loadSalesforceUser = require('../middleware/loadSalesforceUser');

// Controller
const authController = require('../controllers/authController');
const serviceController = require('../controllers/serviceController');
const leadController = require('../controllers/leadController');

// ============================================================================
// 1. ROTTE PUBBLICHE (Accessibili a tutti)
// ============================================================================

// Auth & OAuth
route.get('/auth-salesforce', authController.startSalesforceLogin);
route.get('/oauth/callback', authController.handleOAuthCallback);
route.get('/auth-logout-do', authController.logout);

const authPages = [
    { path: '/auth-confirm-mail', title: 'Confirm Mail' },
    { path: '/auth-createpw', title: 'Create Password' },
    { path: '/auth-lock-screen', title: 'Lock Screen' },
    { path: '/auth-login-pin', title: 'Login Pin' },
    { path: '/auth-login', title: 'Login' },
    { path: '/auth-logout', title: 'Logout' },
    { path: '/auth-recoverpw', title: 'Recover Password' },
    { path: '/auth-register', title: 'Sign Up' },
    { path: '/error-400', title: 'Error 400' },
    { path: '/error-401', title: 'Error 401' },
    { path: '/error-403', title: 'Error 403' },
    { path: '/error-404', title: 'Error 404' }, // 404 standard
    { path: '/error-500', title: 'Error 500' },
    { path: '/error-service-unavailable', title: 'Error 408' },
    { path: '/layouts-horizontal', title: 'Horizontal Layout' },
    { path: '/pages-coming-soon', title: 'Coming Soon' },
    { path: '/pages-maintenance', title: 'Maintenance' },
];

authPages.forEach(page => {
    route.get(page.path, (req, res) => {
        res.render(page.path.substring(1), { 
            title: page.title, 
            layout: 'partials/base-layout' 
        });
    });
});

// ============================================================================
// 2. MIDDLEWARE DI PROTEZIONE
// ============================================================================
route.use(requireAuth);
route.use(loadSalesforceUser);

// ============================================================================
// 3. ROTTE PROTETTE (Richiedono Login)
// ============================================================================

// Dashboard Principale
route.get('/', (req, res) => res.render('index', { title: 'Dashboard' }));
route.get('/index', (req, res) => res.render('index', { title: 'Dashboard' }));

// API
route.get('/api/servizi/products', serviceController.getProducts);
route.get('/api/leads/all', leadController.getLeads);

const pagesConfig = [
    // Apps
    { path: '/apps-service', title: 'Servizi' },
    { path: '/apps-leads', title: 'Lead' },
    { path: '/apps-invoice-create', title: 'Invoice Create' },
    { path: '/apps-invoice-details', title: 'Invoice Details' },
    { path: '/apps-invoices', title: 'Invoices' },
    { path: '/apps-projects', title: 'Projects' },
    { path: '/apps-tickets', title: 'Tickets' },
    { path: '/apps-user-contacts', title: 'User Contacts' },
    { path: '/apps-user-profile', title: 'User Profile' },

    // Charts
    { path: '/charts-apex-area', title: 'Area Charts' },
    { path: '/charts-apex-bar', title: 'Bar Charts' },
    { path: '/charts-apex-boxplot', title: 'Boxplot Charts' },
    { path: '/charts-apex-bubble', title: 'Bubble Charts' },
    { path: '/charts-apex-candlestick', title: 'Candlestick Charts' },
    { path: '/charts-apex-column', title: 'Column Charts' },
    { path: '/charts-apex-funnel', title: 'Funnel Charts', subtitle: 'Apex' },
    { path: '/charts-apex-heatmap', title: 'Heatmap Charts' },
    { path: '/charts-apex-line', title: 'Line Charts' },
    { path: '/charts-apex-mixed', title: 'Mixed Charts' },
    { path: '/charts-apex-pie', title: 'Pie Charts' },
    { path: '/charts-apex-polar-area', title: 'Polar Area Charts' },
    { path: '/charts-apex-radar', title: 'Radar Charts' },
    { path: '/charts-apex-radialbar', title: 'Radialbar Charts' },
    { path: '/charts-apex-scatter', title: 'Scatter Charts' },
    { path: '/charts-apex-slope', title: 'Slope Charts', subtitle: 'Apex' },
    { path: '/charts-apex-sparklines', title: 'Sparklines Charts' },
    { path: '/charts-apex-timeline', title: 'Timeline Charts' },
    { path: '/charts-apex-treemap', title: 'Treemap Charts' },

    // Errors
    { path: '/error-404-alt', title: 'Error 404' },

    // Extended UI
    { path: '/extended-dragula', title: 'Dragula' },
    { path: '/extended-ratings', title: 'Ratings' },
    { path: '/extended-scrollbar', title: 'Scrollbar' },
    { path: '/extended-sweetalerts', title: 'Sweet Alerts' },

    // Forms
    { path: '/form-editors', title: 'Editors' },
    { path: '/form-elements', title: 'Form Elements' },
    { path: '/form-fileuploads', title: 'Fileuploads' },
    { path: '/form-inputmask', title: 'Inputmask' },
    { path: '/form-layouts', title: 'Layouts' },
    { path: '/form-picker', title: 'Picker' },
    { path: '/form-range-slider', title: 'Range Slider' },
    { path: '/form-select', title: 'Select' },
    { path: '/form-validation', title: 'Validation' },
    { path: '/form-wizard', title: 'Wizard' },

    // Icons
    { path: '/icons-remix', title: 'Remixicon' },
    { path: '/icons-solar', title: 'Solar Icons' },
    { path: '/icons-tabler', title: 'Tabler Icons' },

    // Layouts
    { path: '/layouts-compact', title: 'Compact' },
    { path: '/layouts-detached', title: 'Detached' },
    { path: '/layouts-full', title: 'Full Layouts' },
    { path: '/layouts-fullscreen', title: 'Fullscreen' },
    { path: '/layouts-hover', title: 'Hover' },
    { path: '/layouts-icon-view', title: 'Icon View' },

    // Maps
    { path: '/maps-google', title: 'Google Maps' },
    { path: '/maps-leaflet', title: 'Leaflet Maps' },
    { path: '/maps-vector', title: 'Vector Maps' },

    // Pages
    { path: '/pages-faq', title: 'Faq' },
    { path: '/pages-pricing', title: 'Pricing' },
    { path: '/pages-starter', title: 'Starter Page' },
    { path: '/pages-terms-conditions', title: 'Terms & Conditions' },
    { path: '/pages-timeline', title: 'Timeline' },

    // Tables
    { path: '/tables-basic', title: 'Basic Tables' },
    { path: '/tables-datatable', title: 'Datatable Tables' },
    { path: '/tables-gridjs', title: 'Gridjs Tables' },

    // UI Elements
    { path: '/ui-accordions', title: 'Accordions' },
    { path: '/ui-alerts', title: 'Alerts' },
    { path: '/ui-avatars', title: 'Avatars' },
    { path: '/ui-badges', title: 'Badges' },
    { path: '/ui-breadcrumb', title: 'Breadcrumb' },
    { path: '/ui-buttons', title: 'Buttons' },
    { path: '/ui-cards', title: 'Cards' },
    { path: '/ui-carousel', title: 'Carousel' },
    { path: '/ui-collapse', title: 'Collapse' },
    { path: '/ui-dropdowns', title: 'Dropdowns' },
    { path: '/ui-embed-video', title: 'Embed Video' },
    { path: '/ui-grid', title: 'Grid' },
    { path: '/ui-links', title: 'Links' },
    { path: '/ui-list-group', title: 'List Group' },
    { path: '/ui-modals', title: 'Modals' },
    { path: '/ui-notifications', title: 'Notifications' },
    { path: '/ui-offcanvas', title: 'Offcanvas' },
    { path: '/ui-pagination', title: 'Pagination' },
    { path: '/ui-placeholders', title: 'Placeholders' },
    { path: '/ui-popovers', title: 'Popovers' },
    { path: '/ui-progress', title: 'Progress' },
    { path: '/ui-ratios', title: 'Ratios' },
    { path: '/ui-scrollspy', title: 'Scrollspy' },
    { path: '/ui-spinners', title: 'Spinners' },
    { path: '/ui-tabs', title: 'Tabs' },
    { path: '/ui-tooltips', title: 'Tooltips' },
    { path: '/ui-typography', title: 'Typography' },
    { path: '/ui-utilities', title: 'Utilities' },
    { path: '/widgets', title: 'Widgets' },
];

// Generazione automatica rotte statiche
pagesConfig.forEach(page => {
    route.get(page.path, (req, res) => {
        res.render(page.path.substring(1), { 
            title: page.title,
            subtitle: page.subtitle || undefined 
        });
    });
});

module.exports = route;