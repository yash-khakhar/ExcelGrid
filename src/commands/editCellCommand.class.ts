import { Command } from "../interface/Command.js";
import { DataManager } from "../models/dataManager.class.js";

export class EditCellCommand implements Command {
    constructor(
        private dataManager: DataManager,
        private row: number,
        private col: number,
        private oldValue: string,
        private newValue: string
    ) {}

    public execute(): void {
        this.dataManager.setCellValue(this.row, this.col, this.newValue);
    }

    public undo(): void {
        this.dataManager.setCellValue(this.row, this.col, this.oldValue);
    }
}