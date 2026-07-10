
import { SPREADSHEET_CONFIG } from "../config/constants.js";

export class DataManager {
    public readonly totalRows = SPREADSHEET_CONFIG.TOTAL_ROWS;
    public readonly totalCols = SPREADSHEET_CONFIG.TOTAL_COLS;
    
    private cellData: Map<string, string> = new Map();
    private rowHeights: number[] = [];
    private colWidths: number[] = [];
    
    public rowPositions: number[] = [];
    public colPositions: number[] = [];

    constructor(
        private defaultRowHeight = SPREADSHEET_CONFIG.DEFAULT_ROW_HEIGHT, 
        private defaultColWidth = SPREADSHEET_CONFIG.DEFAULT_COL_WIDTH
    ) {
        this.initSizes();
    }

    public getRowHeights(): number[] {
        return this.rowHeights;
    }

    public getColWidths(): number[] {
        return this.colWidths;
    }

    public getRowPositions(): number[] {
        return this.rowPositions;
    }

    public getColPositions(): number[] {
        return this.colPositions;
    }

    private initSizes(): void {
        let currentTop = 0;
        for (let i = 0; i <= this.totalRows; i++) {
            this.rowHeights.push(this.defaultRowHeight);
            this.rowPositions.push(currentTop);
            currentTop += this.defaultRowHeight;
        }

        let currentLeft = 0;
        for (let j = 0; j <= this.totalCols; j++) {
            this.colWidths.push(this.defaultColWidth);
            this.colPositions.push(currentLeft);
            currentLeft += this.defaultColWidth;
        }
    }

    public getCellValue(row: number, col: number): string {
        return this.cellData.get(`${row},${col}`) || '';
    }

    public setCellValue(row: number, col: number, value: string): void {
        if (value.trim() === '') {
            this.cellData.delete(`${row},${col}`);
        } else {
            this.cellData.set(`${row},${col}`, value);
        }
    }

    public getRowHeight(row: number): number { 
        return this.rowHeights[row] ?? this.defaultRowHeight; 
    }

    public getColWidth(col: number): number { 
        return this.colWidths[col] ?? this.defaultColWidth; 
    }

    public resizeRow(row: number, newHeight: number): void {
        const validatedHeight = Math.max(15, newHeight);
        const currentHeight = this.getRowHeight(row);
        const diff = validatedHeight - currentHeight;
        this.rowHeights[row] = validatedHeight;

        for (let i = row + 1; i <= this.totalRows; i++) {
            if (this.rowPositions[i] !== undefined) {
                this.rowPositions[i]! += diff;
            }
        }
    }

    public resizeCol(col: number, newWidth: number): void {
        const validatedWidth = Math.max(30, newWidth);
        const currentWidth = this.getColWidth(col);
        const diff = validatedWidth - currentWidth;
        this.colWidths[col] = validatedWidth;

        for (let j = col + 1; j <= this.totalCols; j++) {
            if (this.colPositions[j] !== undefined) {
                this.colPositions[j]! += diff;
            }
        }
    }

    public findIndex(positions: number[], target: number): number {
        let low = 0, high = positions.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const currentPos = positions[mid] ?? 0;
            const nextPos = positions[mid + 1];

            if (currentPos <= target && (mid === positions.length - 1 || (nextPos !== undefined && nextPos > target))) {
                return mid;
            } else if (currentPos > target) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return 0;
    }

    public getCellDataMap(): Map<string, string> {
        return this.cellData;
    }

    public clearAllData(): void {
        this.cellData.clear();
    }

    public restoreStateSnapshot(
        cells: Map<string, string>,
        rowH: number[],
        colW: number[],
        rowP: number[],
        colP: number[]
    ): void {
        this.cellData = new Map(cells);
        this.rowHeights = [...rowH];
        this.colWidths = [...colW];
        this.rowPositions = [...rowP];
        this.colPositions = [...colP];
    }

}