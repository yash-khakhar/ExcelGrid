export class JSONLoader {
    
    public static loadFromFile(file: File, callback: (rawData: any) => void): void {
        
        const reader = new FileReader();
        
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                const jsonText = event.target?.result as string;
                if (!jsonText) throw new Error("File content is empty.");
                
                // Safely parse loose data shapes
                let rawData = JSON.parse(jsonText);

                callback(rawData);

            } catch (err) {
                alert(`Failed to load JSON data: ${err instanceof Error ? err.message : String(err)}`);
            }
        };

        reader.readAsText(file);
    }
}