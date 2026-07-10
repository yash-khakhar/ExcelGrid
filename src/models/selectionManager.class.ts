import { SelectionRange } from "../interface/SelectionRange.js";
import { NormalizedRange } from "../interface/NormalizedRange.js";
import { MetricsResult } from "../interface/MetricsResult.js";
import { DataManager } from "./dataManager.class.js";

export class SelectionManager {
    public currentSelection: SelectionRange | null = null;
    public isSelecting = false;

    public setSelection(startRow: number, startCol: number, endRow: number, endCol: number): void {
        this.currentSelection = {
            start: { row: startRow, col: startCol },
            end: { row: endRow, col: endCol }
        };
    }

    public getNormalizedRange(): NormalizedRange | null {
        if (!this.currentSelection) return null;
        return {
            minRow: Math.min(this.currentSelection.start.row, this.currentSelection.end.row),
            maxRow: Math.max(this.currentSelection.start.row, this.currentSelection.end.row),
            minCol: Math.min(this.currentSelection.start.col, this.currentSelection.end.col),
            maxCol: Math.max(this.currentSelection.start.col, this.currentSelection.end.col),
        };
    }

    public calculateMetrics(dataManager: DataManager): MetricsResult | null {
        const range = this.getNormalizedRange();
        if (!range) return null;

        let sum = 0;
        let count = 0;
        let min = Infinity;
        let max = -Infinity;
        let numericCount = 0;

        for (let r = range.minRow; r <= range.maxRow; r++) {
            for (let c = range.minCol; c <= range.maxCol; c++) {
                const val = dataManager.getCellValue(r, c).trim();
                
                // Increment overall count for any non-empty cell evaluated
                if (val !== '') {
                    count++;
                    
                    // Safely extract numeric attributes if applicable
                    const num = Number(val);
                    if (!isNaN(num)) {
                        sum += num;
                        if (num < min) min = num;
                        if (num > max) max = num;
                        numericCount++;
                    }
                }
            }
        }

        return {
            count,
            sum: numericCount > 0 ? sum : 0,
            min: numericCount > 0 ? min : 0,
            max: numericCount > 0 ? max : 0,
            avg: numericCount > 0 ? sum / numericCount : 0
        };
    }
}