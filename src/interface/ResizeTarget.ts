export interface ResizeTarget {
    type: 'row' | 'col';
    index: number;
    startPos: number;
    startSize: number;
}