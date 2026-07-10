export const SPREADSHEET_CONFIG = {

    // Grid Boundaries
    TOTAL_ROWS: 100000,
    TOTAL_COLS: 500,

    // Layout Dimensions (Pixels)
    DEFAULT_ROW_HEIGHT: 24,
    DEFAULT_COL_WIDTH: 80,
    ROW_HEADER_WIDTH: 50,
    COL_HEADER_HEIGHT: 32,
    
    // Interaction Settings
    RESIZE_THRESHOLD: 4,
    AUTO_SCROLL_THRESHOLD: 30,
    AUTO_SCROLL_SPEED: 15,
    AUTO_SCROLL_INTERVAL_MS: 30,
    
    // Styling
    EDIT_BORDER_COLOR: '#217346',
    FONT_STYLE: '13px Calibri',

} as const;