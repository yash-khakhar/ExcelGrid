import { InteractionHandler } from "./InteractionHandler.js";
import { ClickCoords } from "../../interface/ClickCoords.js";
import { Spreadsheet } from "../../core/Spreadsheet.js";

export class ColSelectionHandler implements InteractionHandler {

    private startCol = -1;

    public canHandle(coords: ClickCoords, _spreadsheet: Spreadsheet): boolean {
        return coords.onColHeader && !coords.onRowHeader;
    }

    public onMouseDown(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet): void {
        const dataMgr = spreadsheet.getDataManager();
        const gridX = coords.x - spreadsheet.getRenderer().getRowHeaderWidth() + spreadsheet.getScrollX();

        if (gridX >= 0) {
            const col = dataMgr.findIndex(dataMgr.colPositions, gridX);
            if (col >= 0 && col < dataMgr.totalCols) {
                this.startCol = col;
                spreadsheet.getSelectionManager().isSelecting = true;
                spreadsheet.getSelectionManager().setSelection(0, col, dataMgr.totalRows - 1, col);
                spreadsheet.updateStatusBar();
                spreadsheet.draw();
            }
        }
    }

    public onMouseMove(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet): void {
        if (this.startCol === -1) return;
        const dataMgr = spreadsheet.getDataManager();
        const gridX = coords.x - spreadsheet.getRenderer().getRowHeaderWidth() + spreadsheet.getScrollX();

        if (gridX >= 0) {
            const currentCol = dataMgr.findIndex(dataMgr.colPositions, gridX);
            spreadsheet.getSelectionManager().setSelection(0, this.startCol, dataMgr.totalRows - 1, currentCol);
            spreadsheet.updateStatusBar();
            spreadsheet.draw();
        }
    }

    public onMouseUp(_e: MouseEvent, spreadsheet: Spreadsheet): boolean {
        spreadsheet.getSelectionManager().isSelecting = false;
        this.startCol = -1;
        spreadsheet.updateStatusBar();
        return true;
    }
    
}