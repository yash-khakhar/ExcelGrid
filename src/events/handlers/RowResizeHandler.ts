import { InteractionHandler } from "./InteractionHandler.js";
import { ClickCoords } from "../../interface/ClickCoords.js";
import { Spreadsheet } from "../../core/Spreadsheet.js";
import { ResizeTarget } from "../../interface/ResizeTarget.js";
import { ResizeCommand } from "../../commands/resizeCommand.class.js";

export class RowResizeHandler implements InteractionHandler {

    private target: ResizeTarget | null = null;

    public canHandle(coords: ClickCoords, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): boolean {
        const edge = spreadsheet.checkResizeEdge(coords.x, coords.y);
        if (edge && edge.type === 'row') {
            this.target = edge;
            canvas.style.cursor = 'row-resize';
            return true;
        }
        return false;
    }

    public onMouseDown(_e: MouseEvent, _coords: ClickCoords, spreadsheet: Spreadsheet): void {
        if (this.target) {
            spreadsheet.setResizeTarget(this.target);
        }
    }

    public onMouseMove(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet): void {
        if (!this.target) return;
        const deltaY = coords.y - this.target.startPos;
        spreadsheet.getDataManager().resizeRow(this.target.index, this.target.startSize + deltaY);
        spreadsheet.draw();
    }

    public onMouseUp(_e: MouseEvent, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): boolean {
        if (!this.target) return true;

        const dataMgr = spreadsheet.getDataManager();
        const finalHeight = dataMgr.getRowHeight(this.target.index);

        if (this.target.startSize !== finalHeight) {
            const cmd = new ResizeCommand(dataMgr, 'row', this.target.index, this.target.startSize, finalHeight);
            spreadsheet.getCommandManager().executeCommand(cmd);
        }

        spreadsheet.setResizeTarget(null);
        this.target = null;
        canvas.style.cursor = 'default';
        spreadsheet.updateStatusBar();
        return true;
    }
    
}