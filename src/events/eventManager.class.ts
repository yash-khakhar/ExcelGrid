import { Spreadsheet } from "../core/Spreadsheet.js";
import { ClickCoords } from "../interface/ClickCoords.js";
import { SPREADSHEET_CONFIG } from "../config/constants.js";
import { ResizeCommand } from "../commands/resizeCommand.class.js";

export class EventManager {
    private lastMouseEvent: MouseEvent | null = null;
    private lastMouseCoords: { x: number; y: number } | null = null;
    private isMouseDown = false;
    private autoScrollInterval: number | null = null;

    constructor(private context: Spreadsheet, private canvas: HTMLCanvasElement) {
        this.registerEvents();
    }

    private registerEvents(): void {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        const inputElement = this.context.getCellInputElement();
        
        const resizeCanvasBuffer = () => {
            this.canvas.width = this.canvas.parentElement?.clientWidth ?? window.innerWidth;
            this.canvas.height = (this.canvas.parentElement?.clientHeight ?? window.innerHeight) - SPREADSHEET_CONFIG.COL_HEADER_HEIGHT;
            this.context.draw();
        };

        resizeCanvasBuffer();
        window.addEventListener('resize', resizeCanvasBuffer);

        inputElement.addEventListener('input', () => {
            const activeCell = this.context.getActiveEditCell();
            if (activeCell) {
                const baseWidth = this.context.getDataManager().getColWidth(activeCell.col);
                this.context.adjustOverlayWidth(baseWidth);
            }
        });
        
        window.addEventListener('wheel', (e: WheelEvent) => {
            if (e.target !== this.canvas && !this.canvas.contains(e.target as Node)) {
                return; 
            }
            e.preventDefault();
            this.context.setScroll(
                Math.max(0, this.context.getScrollX() + e.deltaX),
                Math.max(0, this.context.getScrollY() + e.deltaY)
            );
            this.context.commitCellInput();

            if (this.context.getSelectionManager().isSelecting && this.isMouseDown && this.lastMouseEvent) {
                const coords = this.getGridClickCoords(this.lastMouseEvent);
                if (!coords.onRowHeader && !coords.onColHeader) {
                    const cell = this.context.getCellAtPixels(coords.x, coords.y);
                    const selection = this.context.getSelectionManager().currentSelection;
                    if (cell && selection) {
                        selection.end = cell;
                        this.context.updateStatusBar();
                    }
                }
            }
            this.context.draw();
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

    private onMouseDown(e: MouseEvent): void {
        this.isMouseDown = true;
        this.lastMouseEvent = e;

        const coords = this.getGridClickCoords(e);
        this.lastMouseCoords = { x: coords.x, y: coords.y };
        this.context.commitCellInput();

        const resizeEdge = this.context.checkResizeEdge(coords.x, coords.y);
        if (resizeEdge) {
            this.context.setResizeTarget(resizeEdge);
            return;
        }

        //if (coords.onRowHeader || coords.onColHeader) return;
        const dataMgr = this.context.getDataManager();
        const selectionMgr = this.context.getSelectionManager();

        if (coords.onRowHeader && !coords.onColHeader) {

            // Calculate grid-Y relative to scroll position
            const gridY = coords.y - this.context.getRenderer().getColHeaderHeight() + this.context.getScrollY();
            if (gridY >= 0) {
                const row = dataMgr.findIndex(dataMgr.rowPositions, gridY);
                if (row >= 0 && row < dataMgr.totalRows) {
                    selectionMgr.isSelecting = true;
                    // Highlight from column 0 to the final column index
                    selectionMgr.setSelection(row, 0, row, dataMgr.totalCols - 1);
                    this.context.updateStatusBar();
                    this.context.draw();
                }
            }
            return;

        }

        // 2. CLICKED ON COLUMN HEADER -> Select the entire Column
        if (coords.onColHeader && !coords.onRowHeader) {
            // Calculate grid-X relative to scroll position
            const gridX = coords.x - this.context.getRenderer().getRowHeaderWidth() + this.context.getScrollX();
            if (gridX >= 0) {
                const col = dataMgr.findIndex(dataMgr.colPositions, gridX);
                if (col >= 0 && col < dataMgr.totalCols) {
                    selectionMgr.isSelecting = true;
                    // Highlight from row 0 to the final row index
                    selectionMgr.setSelection(0, col, dataMgr.totalRows - 1, col);
                    this.context.updateStatusBar();
                    this.context.draw();
                }
            }
            return;
        }

        // // 3. CLICKED ON THE CORNER INTERSECT (Top-Left Box) -> Select EVERYTHING
        // if (coords.onRowHeader && coords.onColHeader) {
        //     selectionMgr.isSelecting = true;
        //     selectionMgr.setSelection(0, 0, dataMgr.totalRows - 1, dataMgr.totalCols - 1);
        //     this.context.updateStatusBar();
        //     this.context.draw();
        //     return;
        // }

        const cell = this.context.getCellAtPixels(coords.x, coords.y);
        if (cell) {
            this.context.getSelectionManager().isSelecting = true;
            this.context.getSelectionManager().setSelection(cell.row, cell.col, cell.row, cell.col);
            this.context.draw();
        }
    }

    private onMouseMove(e: MouseEvent): void {
        this.lastMouseEvent = e;
        const coords = this.getGridClickCoords(e);
        this.lastMouseCoords = { x: coords.x, y: coords.y };

        const resizeTarget = this.context.getResizeTarget();
        if (resizeTarget) {
            if (resizeTarget.type === 'col') {
                const deltaX = coords.x - resizeTarget.startPos;
                this.context.getDataManager().resizeCol(resizeTarget.index, resizeTarget.startSize + deltaX);
            } else {
                const deltaY = coords.y - resizeTarget.startPos;
                this.context.getDataManager().resizeRow(resizeTarget.index, resizeTarget.startSize + deltaY);
            }
            this.context.draw();
            return;
        }

        const edge = this.context.checkResizeEdge(coords.x, coords.y);
        if (edge) {
            this.canvas.style.cursor = edge.type === 'col' ? 'col-resize' : 'row-resize';
        } else {
            this.canvas.style.cursor = 'default';
        }

        if (this.context.getSelectionManager().isSelecting) {
            if (coords.onRowHeader || coords.onColHeader) return;
            const cell = this.context.getCellAtPixels(coords.x, coords.y);
            const selection = this.context.getSelectionManager().currentSelection;
            if (cell && selection) {
                selection.end = cell;
                this.context.updateStatusBar();
                this.context.draw();
            }

            const scrollThreshold = SPREADSHEET_CONFIG.AUTO_SCROLL_THRESHOLD; 

            const nearBottom = coords.y >= this.canvas.height - scrollThreshold;
            const nearRight = coords.x >= this.canvas.width - scrollThreshold;
            const nearTop = coords.y <= this.context.getRenderer().getColHeaderHeight() + scrollThreshold;
            const nearLeft = coords.x <= this.context.getRenderer().getRowHeaderWidth() + scrollThreshold;

            if ((nearBottom || nearRight || nearTop || nearLeft) && this.isMouseDown) {
                if (this.autoScrollInterval === null) {
                    this.autoScrollInterval = window.setInterval(
                        () => this.handleAutoScroll(), 
                        SPREADSHEET_CONFIG.AUTO_SCROLL_INTERVAL_MS
                    );
                }
            } else {
                if (this.autoScrollInterval !== null) {
                    clearInterval(this.autoScrollInterval);
                    this.autoScrollInterval = null;
                }
            }
        }
    }

    private handleAutoScroll(): void {
        const selection = this.context.getSelectionManager().currentSelection;
        if (!this.lastMouseCoords || !selection) return;

        const coords = this.lastMouseCoords;
        const scrollSpeed = SPREADSHEET_CONFIG.AUTO_SCROLL_SPEED; 
        const scrollThreshold = SPREADSHEET_CONFIG.AUTO_SCROLL_THRESHOLD;
        let scrolled = false;

        if (coords.y >= this.canvas.height - scrollThreshold) {
            this.context.setScroll(this.context.getScrollX(), this.context.getScrollY() + scrollSpeed);
            scrolled = true;
        } else if (coords.y <= this.context.getRenderer().getColHeaderHeight() + scrollThreshold) {
            this.context.setScroll(this.context.getScrollX(), Math.max(0, this.context.getScrollY() - scrollSpeed));
            scrolled = true;
        }

        if (coords.x >= this.canvas.width - scrollThreshold) {
            this.context.setScroll(this.context.getScrollX() + scrollSpeed, this.context.getScrollY());
            scrolled = true;
        } else if (coords.x <= this.context.getRenderer().getRowHeaderWidth() + scrollThreshold) {
            this.context.setScroll(Math.max(0, this.context.getScrollX() - scrollSpeed), this.context.getScrollY());
            scrolled = true;
        }

        if (scrolled) {
            this.context.commitCellInput();
            const cell = this.context.getCellAtPixels(coords.x, coords.y);
            if (cell) {
                selection.end = cell;
                this.context.updateStatusBar();
            }
            this.context.draw();
        }
    }

    private onMouseUp(): void {
        this.isMouseDown = false;
        this.context.getSelectionManager().isSelecting = false;

        const resizeTarget = this.context.getResizeTarget();
        if (resizeTarget) {

            const dataMgr = this.context.getDataManager();
            
            // Find what the final size was dropped at
            const finalSize = resizeTarget.type === 'col' 
                ? dataMgr.getColWidth(resizeTarget.index)
                : dataMgr.getRowHeight(resizeTarget.index);

            // Only commit to the Undo stack if the size actually changed!
            if (resizeTarget.startSize !== finalSize) {
                const resizeCmd = new ResizeCommand(
                    dataMgr,
                    resizeTarget.type,
                    resizeTarget.index,
                    resizeTarget.startSize, 
                    finalSize
                );
                
                this.context.getCommandManager().executeCommand(resizeCmd);
            }
        }

        this.context.setResizeTarget(null);
        this.lastMouseEvent = null;
        this.lastMouseCoords = null;

        if (this.autoScrollInterval !== null) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }

        this.context.updateStatusBar();
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