import { Command } from "../interface/Command.js";
import { DataManager } from "../models/dataManager.class.js";

export class LoadFileCommand implements Command {
    
    private oldCellData: Map<string, string>;
    private oldRowHeights: number[];
    private oldColWidths: number[];
    private oldRowPositions: number[];
    private oldColPositions: number[];

    private newCells: { row: number; col: number; value: string }[] = [];

    constructor(
        private dataManager: DataManager,
        rawJsonData: any
    ) {
        
        this.oldCellData = new Map(dataManager.getCellDataMap()); 
        this.oldRowHeights = [...dataManager.getRowHeights()];
        this.oldColWidths = [...dataManager.getColWidths()];
        this.oldRowPositions = [...dataManager.getRowPositions()];
        this.oldColPositions = [...dataManager.getColPositions()];

        this.parseIncomingData(rawJsonData);
    }

    private parseIncomingData(rawData: any): void {
        let records = rawData;
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            const nestedArray = Object.values(rawData).find(val => Array.isArray(val));
            records = nestedArray ? nestedArray : [rawData];
        }

        if (!Array.isArray(records)) return;

        const columnHeaders: string[] = [];
        records.forEach(item => {
            if (item && typeof item === 'object') {
                Object.keys(item).forEach(key => {
                    if (!columnHeaders.includes(key)) columnHeaders.push(key);
                });
            }
        });

        columnHeaders.forEach((header, colIndex) => {
            this.newCells.push({ row: 0, col: colIndex, value: header });
        });

        records.forEach((record, rowIndex) => {
            const dataRow = rowIndex + 1;
            columnHeaders.forEach((key, colIndex) => {
                const val = record[key];
                const cleanVal = val !== null && val !== undefined 
                    ? (typeof val === 'object' ? JSON.stringify(val) : String(val))
                    : '';
                this.newCells.push({ row: dataRow, col: colIndex, value: cleanVal });
            });
        });
    }

    public execute(): void {
        
        this.dataManager.clearAllData();

        this.newCells.forEach(cell => {
            this.dataManager.setCellValue(cell.row, cell.col, cell.value);
        });
    }

    public undo(): void {
        
        this.dataManager.restoreStateSnapshot(
            this.oldCellData,
            this.oldRowHeights,
            this.oldColWidths,
            this.oldRowPositions,
            this.oldColPositions
        );
    }
}