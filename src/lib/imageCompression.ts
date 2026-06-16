import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    initialQuality?: number;
    onProgress?: (progress: number) => void;
}

export const compressImage = async (file: File, options: CompressionOptions = {}) => {
    const { onProgress, ...compressionOptions } = options;
    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        ...compressionOptions
    };

    try {
        // Simulate progress since browser-image-compression doesn't natively support it
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress > 90) progress = 90;
            if (onProgress) {
                onProgress(progress);
            }
        }, 100);

        const compressedFile = await imageCompression(file, defaultOptions);

        clearInterval(progressInterval);
        if (onProgress) {
            onProgress(100);
        }

        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        if (onProgress) {
            onProgress(100);
        }
        return file; // Return original file if compression fails
    }
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};
