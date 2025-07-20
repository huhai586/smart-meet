import type {UploadFile} from "~node_modules/antd";

const getFileData = (file: UploadFile) => {
    return new Promise((resolve, reject) => {
        // Try to get file data from different sources
        let fileToRead: File | Blob | null = null;

        // Method 1: originFileObj (most common)
        if (file.originFileObj) {
            const obj = file.originFileObj as File | Blob;
            if (obj instanceof File || obj instanceof Blob) {
                fileToRead = obj;
            }
        }
        // Method 2: Check if file itself is a File object (direct file upload)
        else if (typeof (file as File).stream === 'function' && typeof (file as File).arrayBuffer === 'function') {
            fileToRead = file as unknown as File;
        }
        // Method 3: Check if file has url property and try to fetch it
        else if (file.url) {
            // Handle URL-based files (e.g., from server response)
            fetch(file.url)
                .then(response => response.text())
                .then(text => resolve(text))
                .catch(error => reject(new Error(`Failed to fetch file from URL: ${error.message}`)));
            return;
        }
        // Method 4: Check if file has response property with file data
        else if (file.response && typeof file.response === 'string') {
            resolve(file.response);
            return;
        }

        // If no valid file source found
        if (!fileToRead) {
            reject(new Error('No valid file source found. File must have originFileObj, be a File instance, have a url, or contain response data.'));
            return;
        }

        // Read the file using FileReader
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result as string);
        reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
        reader.readAsText(fileToRead);
    });
}

export default getFileData
