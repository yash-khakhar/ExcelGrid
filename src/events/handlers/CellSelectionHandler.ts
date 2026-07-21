import { InteractionHandler } from "./InteractionHandler.js";
import { ClickCoords } from "../../interface/ClickCoords.js";
import { Spreadsheet } from "../../core/Spreadsheet.js";

export class CellSelectionHandler implements InteractionHandler {

    private startCell: { row: number; col: number } | null = null;
    private autoScrollAnimationId: number | null = null;
    private lastCoords: ClickCoords | null = null;

    public canHandle(coords: ClickCoords, _spreadsheet: Spreadsheet): boolean {
        return !coords.onRowHeader && !coords.onColHeader;
    }

    public onMouseDown(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet): void {
        const cell = spreadsheet.getCellAtPixels(coords.x, coords.y);
        if (cell) {
            this.startCell = cell;
            const selectionMgr = spreadsheet.getSelectionManager();
            selectionMgr.isSelecting = true;
            selectionMgr.setSelection(cell.row, cell.col, cell.row, cell.col);
            spreadsheet.updateStatusBar();
            spreadsheet.draw();
        }
    }

    public onMouseMove(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): void {
        if (!this.startCell) return;
        this.lastCoords = coords;

        // 1. Update selection range under cursor
        const cell = spreadsheet.getCellAtPixels(coords.x, coords.y);
        if (cell) {
            spreadsheet.getSelectionManager().setSelection(
                this.startCell.row, 
                this.startCell.col, 
                cell.row, 
                cell.col
            );
            spreadsheet.updateStatusBar();
            spreadsheet.draw();
        }

        // 2. Auto-scroll check when mouse is near canvas bounds
        this.handleAutoScroll(coords, spreadsheet, canvas);
    }

    private handleAutoScroll(coords: ClickCoords, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): void {
        
        const margin = 20; // Edge threshold in pixels
        const speed = 15;  // Scroll speed

        let deltaX = 0;
        let deltaY = 0;

        if (coords.x > canvas.clientWidth - margin) deltaX = speed;
        if (coords.x < spreadsheet.getRenderer().getRowHeaderWidth() + margin) deltaX = -speed;
        if (coords.y > canvas.clientHeight - margin) deltaY = speed;
        if (coords.y < spreadsheet.getRenderer().getColHeaderHeight() + margin) deltaY = -speed;

        if (deltaX !== 0 || deltaY !== 0) {
            if (!this.autoScrollAnimationId) {
                const scrollStep = () => {
                    spreadsheet.scrollBy(deltaX, deltaY);
                    if (this.lastCoords) {
                        const cell = spreadsheet.getCellAtPixels(this.lastCoords.x, this.lastCoords.y);
                        if (cell && this.startCell) {
                            spreadsheet.getSelectionManager().setSelection(
                                this.startCell.row,
                                this.startCell.col,
                                cell.row,
                                cell.col
                            );
                            spreadsheet.updateStatusBar();
                        }
                    }
                    this.autoScrollAnimationId = requestAnimationFrame(scrollStep);
                };
                this.autoScrollAnimationId = requestAnimationFrame(scrollStep);
            }
        } else {
            this.stopAutoScroll();
        }
    }

    private stopAutoScroll(): void {
        if (this.autoScrollAnimationId !== null) {
            cancelAnimationFrame(this.autoScrollAnimationId);
            this.autoScrollAnimationId = null;
        }
    }

    public onMouseUp(_e: MouseEvent, spreadsheet: Spreadsheet): boolean {
        this.stopAutoScroll();
        spreadsheet.getSelectionManager().isSelecting = false;
        this.startCell = null;
        this.lastCoords = null;
        spreadsheet.updateStatusBar();
        spreadsheet.draw();
        return true;
    }
}