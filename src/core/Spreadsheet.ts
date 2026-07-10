import { CellCoord } from "../interface/CellCoord.js";
import { ResizeTarget } from "../interface/ResizeTarget.js";
import { CommandManager } from "../commands/commandManager.class.js";
import { DataManager } from "../models/dataManager.class.js";
import { SelectionManager } from "../models/selectionManager.class.js";
import { JSONLoader } from "../util/jsonLoader.class.js";
import { EventManager } from "../events/eventManager.class.js";
import { SPREADSHEET_CONFIG } from "../config/constants.js";
import { RenderEngine } from "../view/renderEngine.class.js";
import { EditCellCommand } from "../commands/editCellCommand.class.js";
import { LoadFileCommand } from "../commands/loadFileCommand.class.js";

export class Spreadsheet {

    private dataManager: DataManager;
    private selectionManager: SelectionManager;
    private commandManager: CommandManager;
    private renderer: RenderEngine;

    private scrollX = 0;
    private scrollY = 0;

    private cellInput!: HTMLInputElement;
    private fileInput!: HTMLInputElement;
    private activeEditCell: CellCoord | null = null;
    private resizeTarget: ResizeTarget | null = null;

    constructor(private canvas: HTMLCanvasElement, private statusBar: HTMLElement) {

        this.dataManager = new DataManager();
        this.selectionManager = new SelectionManager();
        this.commandManager = new CommandManager();
        this.renderer = new RenderEngine(canvas, this.dataManager, this.selectionManager);

        this.initDOMInput();
        this.initJSONLoaderInput();
        
        new EventManager(this, canvas);
        this.draw();

    }

    public getScrollX(): number { return this.scrollX; }
    public getScrollY(): number { return this.scrollY; }
    public setScroll(x: number, y: number): void { this.scrollX = x; this.scrollY = y; }

    public getDataManager(): DataManager { return this.dataManager; }
    public getSelectionManager(): SelectionManager { return this.selectionManager; }
    public getCommandManager(): CommandManager { return this.commandManager; }
    public getRenderer(): RenderEngine { return this.renderer; }
    
    public getResizeTarget(): ResizeTarget | null { return this.resizeTarget; }
    public setResizeTarget(target: ResizeTarget | null): void { this.resizeTarget = target; }
    public getActiveEditCell(): CellCoord | null { return this.activeEditCell; }
    public getCellInputElement(): HTMLInputElement { return this.cellInput; }

    public draw(): void {
        this.renderer.render(this.scrollX, this.scrollY);
    }

    public enterCellEditMode(row: number, col: number): void {
        this.activeEditCell = { row, col };
        const posX = this.dataManager.colPositions[col];
        const posY = this.dataManager.rowPositions[row];
        if (posX === undefined || posY === undefined) return;

        const x = posX - this.scrollX + this.renderer.getRowHeaderWidth();
        const y = posY - this.scrollY + this.renderer.getColHeaderHeight();

        const w = this.dataManager.getColWidth(col);
        const h = this.dataManager.getRowHeight(row);

        this.cellInput.style.left = `${x}px`;
        this.cellInput.style.top = `${y}px`;
        this.cellInput.style.height = `${h - 1}px`;
        this.cellInput.style.zIndex = '100';
        this.cellInput.style.boxShadow = '0px 2px 5px rgba(0,0,0,0.2)';
        this.cellInput.style.minWidth = `${w - 1}px`;

        this.cellInput.value = this.dataManager.getCellValue(row, col);
        this.cellInput.style.display = 'block';

        this.adjustOverlayWidth(w);
        
        setTimeout(() => this.cellInput.focus(), 10);
    }

    public commitCellInput(): void {
        if (!this.activeEditCell) return;
        const { row, col } = this.activeEditCell;
        const oldVal = this.dataManager.getCellValue(row, col);
        const newVal = this.cellInput.value;

        if (oldVal !== newVal) {
            const command = new EditCellCommand(this.dataManager, row, col, oldVal, newVal);
            this.commandManager.executeCommand(command);
            this.updateStatusBar();
        }
        this.cellInput.style.display = 'none';
        this.activeEditCell = null;
    }

    public cancelCellInput(): void {
        this.cellInput.style.display = 'none';
        this.activeEditCell = null;
        this.canvas.focus();
        this.draw();
    }

    public checkResizeEdge(mx: number, my: number): ResizeTarget | null {

        const threshold = SPREADSHEET_CONFIG.RESIZE_THRESHOLD;
        const rowH = this.renderer.getColHeaderHeight();
        const colW = this.renderer.getRowHeaderWidth();

        if (my <= rowH && mx > colW) {
            const startCol = this.dataManager.findIndex(this.dataManager.colPositions, this.scrollX);
            for (let c = startCol; c < this.dataManager.totalCols; c++) {
                const nextColPos = this.dataManager.colPositions[c + 1];
                if (nextColPos === undefined) continue;
                const edgeX = nextColPos - this.scrollX + colW;
                if (Math.abs(mx - edgeX) <= threshold) {
                    return { type: 'col', index: c, startPos: mx, startSize: this.dataManager.getColWidth(c) };
                }
                if (edgeX > mx + threshold) break;
            }
        }

        if (mx <= colW && my > rowH) {
            const startRow = this.dataManager.findIndex(this.dataManager.rowPositions, this.scrollY);
            for (let r = startRow; r < this.dataManager.totalRows; r++) {
                const nextRowPos = this.dataManager.rowPositions[r + 1];
                if (nextRowPos === undefined) continue;
                const edgeY = nextRowPos - this.scrollY + rowH;
                if (Math.abs(my - edgeY) <= threshold) {
                    return { type: 'row', index: r, startPos: my, startSize: this.dataManager.getRowHeight(r) };
                }
                if (edgeY > my + threshold) break;
            }
        }
        return null;
    }

    public getCellAtPixels(mx: number, my: number): CellCoord | null {
        const gridX = mx - this.renderer.getRowHeaderWidth() + this.scrollX;
        const gridY = my - this.renderer.getColHeaderHeight() + this.scrollY;
        if (gridX < 0 || gridY < 0) return null;

        const row = this.dataManager.findIndex(this.dataManager.rowPositions, gridY);
        const col = this.dataManager.findIndex(this.dataManager.colPositions, gridX);
        return { row, col };
    }

    public updateStatusBar(): void {
        const metrics = this.selectionManager.calculateMetrics(this.dataManager);
        if (metrics && metrics.count > 1) {
            this.statusBar.innerText = `Count: ${metrics.count} | Sum: ${metrics.sum} | Average: ${metrics.avg.toFixed(2)} | Min: ${metrics.min} | Max: ${metrics.max}`;
        } else {
            this.statusBar.innerText = 'Ready';
        }
    }

    public triggerJSONLoadDialogue(): void {
        this.commitCellInput();
        this.fileInput.click();
    }

    private initDOMInput(): void {

        this.cellInput = document.createElement('input');
        this.cellInput.style.position = 'absolute';
        this.cellInput.style.display = 'none';
        this.cellInput.style.font = SPREADSHEET_CONFIG.FONT_STYLE;
        this.cellInput.style.border = '2px solid #217346';
        this.cellInput.style.outline = 'none';
        this.cellInput.style.padding = '0 2px';
        
        const parent = this.canvas.parentElement;
        if (!parent) throw new Error("Canvas must have a parent container.");
        parent.appendChild(this.cellInput);
    }

    private initJSONLoaderInput(): void {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.json';
        this.fileInput.style.display = 'none';

        this.fileInput.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                JSONLoader.loadFromFile(file, (rawData) => {
                    const command = new LoadFileCommand(this.dataManager, rawData);
                    this.commandManager.executeCommand(command);
                    this.selectionManager.currentSelection = null; 
                    this.draw();
                    this.updateStatusBar();
                });
            }
            target.value = ''; 
        });
        this.canvas.parentElement?.appendChild(this.fileInput);
    }

    public adjustOverlayWidth(baseWidth: number): void {
        
        const text = this.cellInput.value;
        
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        ctx.font = this.cellInput.style.font || SPREADSHEET_CONFIG.FONT_STYLE;
        const textMetrics = ctx.measureText(text);
        
        const requiredWidth = textMetrics.width + 20; 

        const maxWidth = Math.max(baseWidth, 400); 

        if (requiredWidth > baseWidth) {
            this.cellInput.style.width = `${Math.min(requiredWidth, maxWidth)}px`;
        } else {
            this.cellInput.style.width = `${baseWidth - 1}px`;
        }
    }
}