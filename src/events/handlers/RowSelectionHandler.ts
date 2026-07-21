import { InteractionHandler } from "./InteractionHandler.js";
import { ClickCoords } from "../../interface/ClickCoords.js";
import { Spreadsheet } from "../../core/Spreadsheet.js";

export class RowSelectionHandler implements InteractionHandler {
    
    private startRow = -1;

    public canHandle(coords: ClickCoords, _spreadsheet: Spreadsheet): boolean {
        return coords.onRowHeader && !coords.onColHeader;
    }

    public onMouseDown(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet): void {
        const dataMgr = spreadsheet.getDataManager();
        const gridY = coords.y - spreadsheet.getRenderer().getColHeaderHeight() + spreadsheet.getScrollY();

        if (gridY >= 0) {
            const row = dataMgr.findIndex(dataMgr.rowPositions, gridY);
            if (row >= 0 && row < dataMgr.totalRows) {
                this.startRow = row;
                spreadsheet.getSelectionManager().isSelecting = true;
                spreadsheet.getSelectionManager().setSelection(row, 0, row, dataMgr.totalCols - 1);
                spreadsheet.updateStatusBar();
                spreadsheet.draw();
            }
        }
    }

    public onMouseMove(_e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet): void {
        if (this.startRow === -1) return;
        const dataMgr = spreadsheet.getDataManager();
        const gridY = coords.y - spreadsheet.getRenderer().getColHeaderHeight() + spreadsheet.getScrollY();

        if (gridY >= 0) {
            const currentRow = dataMgr.findIndex(dataMgr.rowPositions, gridY);
            spreadsheet.getSelectionManager().setSelection(this.startRow, 0, currentRow, dataMgr.totalCols - 1);
            spreadsheet.updateStatusBar();
            spreadsheet.draw();
        }
    }

    public onMouseUp(_e: MouseEvent, spreadsheet: Spreadsheet): boolean {
        spreadsheet.getSelectionManager().isSelecting = false;
        this.startRow = -1;
        spreadsheet.updateStatusBar();
        return true;
    }

}