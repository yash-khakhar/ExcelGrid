import { InteractionHandler } from "./InteractionHandler.js";
import { ClickCoords } from "../../interface/ClickCoords.js";
import { Spreadsheet } from "../../core/Spreadsheet.js";

export class InteractionManager {
    
    private handlers: InteractionHandler[] = [];
    private currentHandler: InteractionHandler | null = null;

    constructor(
        private spreadsheet: Spreadsheet,
        private canvas: HTMLCanvasElement
    ) {}

    public registerHandler(handler: InteractionHandler): void {
        this.handlers.push(handler);
    }

    public onMouseDown(e: MouseEvent, coords: ClickCoords): void {
        this.spreadsheet.commitCellInput();

        const matchedHandler = this.handlers.find(h => h.canHandle(coords, this.spreadsheet, this.canvas));
        if (matchedHandler) {
            this.currentHandler = matchedHandler;
            this.currentHandler.onMouseDown?.(e, coords, this.spreadsheet, this.canvas);
        }
    }

    public onMouseMove(e: MouseEvent, coords: ClickCoords): void {
        if (this.currentHandler) {
            this.currentHandler.onMouseMove?.(e, coords, this.spreadsheet, this.canvas);
        } else {
            const hoveredHandler = this.handlers.find(h => h.canHandle(coords, this.spreadsheet, this.canvas));
            if (!hoveredHandler) {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.currentHandler) {
            const isFinished = this.currentHandler.onMouseUp?.(e, this.spreadsheet, this.canvas) ?? true;
            if (isFinished) {
                this.currentHandler = null;
            }
        }
    }
}