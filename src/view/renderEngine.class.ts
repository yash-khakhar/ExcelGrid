import { SelectionManager } from "../models/selectionManager.class.js";
import { DataManager } from "../models/dataManager.class.js";
import { SPREADSHEET_CONFIG } from "../config/constants.js";

export class RenderEngine {
    private ctx: CanvasRenderingContext2D;
    private rowHeaderWidth = SPREADSHEET_CONFIG.ROW_HEADER_WIDTH;
    private colHeaderHeight = SPREADSHEET_CONFIG.COL_HEADER_HEIGHT;

    constructor(
        private canvas: HTMLCanvasElement, 
        private dataManager: DataManager, 
        private selectionManager: SelectionManager
    ) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Could not acquire 2D context from canvas element.");
        }
        this.ctx = context;
    }

    public getRowHeaderWidth(): number { return this.rowHeaderWidth; }
    public getColHeaderHeight(): number { return this.colHeaderHeight; }

    public render(scrollX: number, scrollY: number): void {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const startRow = this.dataManager.findIndex(this.dataManager.rowPositions, scrollY);
        const endRow = this.dataManager.findIndex(this.dataManager.rowPositions, scrollY + height) + 1;
        const startCol = this.dataManager.findIndex(this.dataManager.colPositions, scrollX);
        const endCol = this.dataManager.findIndex(this.dataManager.colPositions, scrollX + width) + 1;

        ctx.save();
        
        // for rendering rows and columns
        for (let r = startRow; r < Math.min(endRow, this.dataManager.totalRows); r++) {
            for (let c = startCol; c < Math.min(endCol, this.dataManager.totalCols); c++) {
                const posX = this.dataManager.colPositions[c];
                const posY = this.dataManager.rowPositions[r];
                if (posX === undefined || posY === undefined) continue;

                const cellX = posX - scrollX + this.rowHeaderWidth;
                const cellY = posY - scrollY + this.colHeaderHeight;
                const cellW = this.dataManager.getColWidth(c);
                const cellH = this.dataManager.getRowHeight(r);

                ctx.strokeStyle = '#e1e1e1';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, cellY, cellW, cellH);

                const val = this.dataManager.getCellValue(r, c);
                if (val) {
                    ctx.fillStyle = '#000000';
                    ctx.font = '13px Calibri, Arial';
                    ctx.textBaseline = 'middle';
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(cellX + 2, cellY, cellW - 4, cellH);
                    ctx.clip();
                    ctx.fillText(val, cellX + 4, cellY + cellH / 2);
                    ctx.restore();
                }
            }
        }

        // --- 2. RENDER SELECTION BOX ---
        const range = this.selectionManager.getNormalizedRange();
        if (range) {
            const posMinX = this.dataManager.colPositions[range.minCol];
            const posMinY = this.dataManager.rowPositions[range.minRow];
            const posMaxX = this.dataManager.colPositions[range.maxCol + 1];
            const posMaxY = this.dataManager.rowPositions[range.maxRow + 1];

            if (posMinX !== undefined && posMinY !== undefined && posMaxX !== undefined && posMaxY !== undefined) {
                const x1 = posMinX - scrollX + this.rowHeaderWidth;
                const y1 = posMinY - scrollY + this.colHeaderHeight;
                const x2 = posMaxX - scrollX + this.rowHeaderWidth;
                const y2 = posMaxY - scrollY + this.colHeaderHeight;

                ctx.fillStyle = 'rgba(33, 115, 70, 0.1)';
                ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

                ctx.strokeStyle = '#217346';
                ctx.lineWidth = 2;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
        }

        // --- 3. RENDER HEADERS ---
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(this.rowHeaderWidth, 0, width, this.colHeaderHeight);
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 1;

        for (let c = startCol; c < Math.min(endCol, this.dataManager.totalCols); c++) {
            const posX = this.dataManager.colPositions[c];
            if (posX === undefined) continue;

            const cellX = posX - scrollX + this.rowHeaderWidth;
            const cellW = this.dataManager.getColWidth(c);

            ctx.strokeRect(cellX, 0, cellW, this.colHeaderHeight);
            ctx.fillStyle = '#000000';
            ctx.font = '12px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.getColLabel(c), cellX + cellW / 2, this.colHeaderHeight / 2);
        }

        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(0, this.colHeaderHeight, this.rowHeaderWidth, height);
        for (let r = startRow; r < Math.min(endRow, this.dataManager.totalRows); r++) {
            const posY = this.dataManager.rowPositions[r];
            if (posY === undefined) continue;

            const cellY = posY - scrollY + this.colHeaderHeight;
            const cellH = this.dataManager.getRowHeight(r);

            ctx.strokeRect(0, cellY, this.rowHeaderWidth, cellH);
            ctx.fillStyle = '#000000';
            ctx.font = '12px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((r + 1).toString(), this.rowHeaderWidth / 2, cellY + cellH / 2);
        }

        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(0, 0, this.rowHeaderWidth, this.colHeaderHeight);
        ctx.strokeRect(0, 0, this.rowHeaderWidth, this.colHeaderHeight);

        ctx.restore();
    }

    private getColLabel(index: number): string {
        let label = '';
        while (index >= 0) {
            label = String.fromCharCode((index % 26) + 65) + label;
            index = Math.floor(index / 26) - 1;
        }
        return label;
    }
}