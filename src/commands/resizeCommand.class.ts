import { Command } from "../interface/Command";
import { DataManager } from "../models/dataManager.class";

export class ResizeCommand implements Command{

    constructor(
        private dataManager: DataManager,
        private type: 'col' | 'row',
        private index: number,
        private oldSize: number,
        private newSize: number
    ) {}
    
    execute(): void {
        if (this.type === 'col') {
            this.dataManager.resizeCol(this.index, this.newSize);
        } else {
            this.dataManager.resizeRow(this.index, this.newSize);
        }
    }
    undo(): void {
        if (this.type === 'col') {
            this.dataManager.resizeCol(this.index, this.oldSize);
        } else {
            this.dataManager.resizeRow(this.index, this.oldSize);
        }
    }

}