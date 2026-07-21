import { ClickCoords } from "../../interface/ClickCoords.js";
import { Spreadsheet } from "../../core/Spreadsheet.js";

export interface InteractionHandler {

    /** Determines if this handler should activate for the given event coordinates */
    canHandle(coords: ClickCoords, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): boolean;

    /** Called when the interaction starts */
    onMouseDown?(e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): void;

    /** Called during active drag/move */
    onMouseMove?(e: MouseEvent, coords: ClickCoords, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): void;

    /** 
     * Called when the mouse button is released.
     * @returns true when the action completes and signals resetting currentHandler to null.
     */
    onMouseUp?(e: MouseEvent, spreadsheet: Spreadsheet, canvas: HTMLCanvasElement): boolean;
    
}