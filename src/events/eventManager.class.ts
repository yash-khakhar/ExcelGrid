import { Spreadsheet } from "../core/Spreadsheet.js";
import { ClickCoords } from "../interface/ClickCoords.js";
import { InteractionManager } from "./handlers/InteractionManager.js";
import { ColResizeHandler } from "./handlers/ColResizeHandler.js";
import { RowResizeHandler } from "./handlers/RowResizeHandler.js";
import { RowSelectionHandler } from "./handlers/RowSelectionHandler.js";
import { CellSelectionHandler } from "./handlers/CellSelectionHandler.js";
import { ColSelectionHandler } from "./handlers/ColSelectionHandler.js";

export class EventManager {
    
    private interactionManager: InteractionManager;

    constructor(private context: Spreadsheet, private canvas: HTMLCanvasElement) {

        this.interactionManager = new InteractionManager(this.context, this.canvas);
        
        this.interactionManager.registerHandler(new ColResizeHandler());
        this.interactionManager.registerHandler(new RowResizeHandler());
        this.interactionManager.registerHandler(new RowSelectionHandler());
        this.interactionManager.registerHandler(new ColSelectionHandler());
        this.interactionManager.registerHandler(new CellSelectionHandler());

        this.registerEvents();
    }

    private registerEvents(): void {

        this.canvas.addEventListener('mousedown', (e) => {
            const coords = this.getGridClickCoords(e);
            this.interactionManager.onMouseDown(e, coords);
        });

        window.addEventListener('mousemove', (e) => {
            const coords = this.getGridClickCoords(e);
            this.interactionManager.onMouseMove(e, coords);
        });

        window.addEventListener('mouseup', (e) => {
            this.interactionManager.onMouseUp(e);
        });

        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        
        window.addEventListener('keydown', this.onKeyDown.bind(this));

        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();

            // Calculate delta for horizontal (Shift + Wheel or touchpad) & vertical scroll
            const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
            const deltaY = e.shiftKey ? 0 : e.deltaY;

            // Delegate scroll calculation to core spreadsheet
            this.context.scrollBy(deltaX, deltaY);
        }, { passive: false });

    }

    private getGridClickCoords(e: MouseEvent): ClickCoords {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return {
            x, y,
            onRowHeader: x < this.context.getRenderer().getRowHeaderWidth(),
            onColHeader: y < this.context.getRenderer().getColHeaderHeight()
        };
    }

    private onDoubleClick(e: MouseEvent): void {
        const coords = this.getGridClickCoords(e);
        if (coords.onRowHeader || coords.onColHeader) return;

        const cell = this.context.getCellAtPixels(coords.x, coords.y);
        if (cell) {
            this.context.enterCellEditMode(cell.row, cell.col);
        }
    }

    private onKeyDown(e: KeyboardEvent): void {

        const commandMgr = this.context.getCommandManager();
        const selectionMgr = this.context.getSelectionManager();
        const dataMgr = this.context.getDataManager();
        const renderer = this.context.getRenderer();
        const activeEditCell = this.context.getActiveEditCell();

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            commandMgr.undo();
            this.context.draw();
            this.context.updateStatusBar();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            commandMgr.redo();
            this.context.draw();
            this.context.updateStatusBar();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            this.context.triggerJSONLoadDialogue();
            return;
        }

        if (activeEditCell && e.key === 'Escape') {
            this.context.cancelCellInput();
            return;
        }

        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

        if (arrowKeys.includes(e.key)) {
            let currentCell = selectionMgr.currentSelection?.start;
            if (!currentCell && activeEditCell) {
                currentCell = activeEditCell;
            }

            if (currentCell) {
                const wasEditing = activeEditCell !== null;
                
                if (wasEditing) {
                    const inputEl = this.context.getCellInputElement(); // Grab the HTML input element
                    const caretPos = inputEl.selectionStart ?? 0;
                    const textLength = inputEl.value.length;
                    
                    // If pressing Right, but cursor isn't at the very end of the text yet -> do nothing, let browser handle text navigation
                    if (e.key === 'ArrowRight' && caretPos < textLength) {
                        return; 
                    }
                    
                    // If pressing Left, but cursor isn't at the very beginning (index 0) -> do nothing, let browser navigate text
                    if (e.key === 'ArrowLeft' && caretPos > 0) {
                        return; 
                    }
                }
                
                e.preventDefault(); 

                if (wasEditing) {
                    this.context.commitCellInput();
                }

                let newRow = currentCell.row;
                let newCol = currentCell.col;

                switch (e.key) {
                    case 'ArrowUp': newRow = Math.max(0, newRow - 1); break;
                    case 'ArrowDown': newRow = Math.min(dataMgr.totalRows - 1, newRow + 1); break;
                    case 'ArrowLeft': newCol = Math.max(0, newCol - 1); break;
                    case 'ArrowRight': newCol = Math.min(dataMgr.totalCols - 1, newCol + 1); break;
                }

                selectionMgr.setSelection(newRow, newCol, newRow, newCol);

                const cellLeft = dataMgr.colPositions[newCol] ?? 0;
                const cellTop = dataMgr.rowPositions[newRow] ?? 0;
                const cellWidth = dataMgr.getColWidth(newCol);
                const cellHeight = dataMgr.getRowHeight(newRow);

                const viewWidth = this.canvas.width - renderer.getRowHeaderWidth();
                const viewHeight = this.canvas.height - renderer.getColHeaderHeight();

                let sx = this.context.getScrollX();
                let sy = this.context.getScrollY();

                if (cellLeft < sx) sx = cellLeft;
                else if (cellLeft + cellWidth > sx + viewWidth) sx = cellLeft + cellWidth - viewWidth;

                if (cellTop < sy) sy = cellTop;
                else if (cellTop + cellHeight > sy + viewHeight) sy = cellTop + cellHeight - viewHeight;

                this.context.setScroll(sx, sy);

                if (wasEditing) {
                    this.context.enterCellEditMode(newRow, newCol);
                }

                this.context.updateStatusBar();
                this.context.draw();
                return; 
            }
        }

        if (activeEditCell && e.key === 'Enter') {
            this.context.commitCellInput();
            this.context.draw();
        }
    }
}