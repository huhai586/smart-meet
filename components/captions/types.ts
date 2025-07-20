export enum Actions {
    TRANSLATE = 'Translate',  
    EXPLAIN = 'Explain',  
    POLISH = 'Polish',  
    ANALYSIS = 'Analysis',  
    ASK = 'Ask',  
    DEFAULT = 'Default',
    SUMMARY = 'Summary',  
}

export interface AIDataItem {
    type: Actions;
    data: string;
} 