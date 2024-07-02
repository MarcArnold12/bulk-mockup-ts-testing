// @ts-ignore: Missing Adobe types
/// <reference path="./photoshop.d.ts"/>

// Settings
app.displayDialogs = DialogModes.NO;
app.bringToFront();
const scriptPath = File($.fileName).parent.fsName.toString().replace(/\\/g, '/');
let replaceLayer: any = null;
const replaceName = "Edit Here (3x4)";

// Function to create a folder
function createFolder(path: string): void {
    const folder = new Folder(path);
    if (!folder.exists) folder.create();
}

// Function to generate a random 4-letter string
function generateRandomString(): string {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Function to save JPG image with a random 4-letter string appended to the fileName
function saveJPG01(path: string, fileName: string): void {
    const randomString = generateRandomString(); // Generate a random 4-letter string
    const saveName = new File(`${path}/${fileName} ${randomString}.jpg`); // Append the random string with a preceding space
    const ss = new JPEGSaveOptions();
    ss.quality = 8;
    ss.embedColorProfile = true;
    ss.formatOptions = FormatOptions.PROGRESSIVE;
    if (ss.formatOptions === FormatOptions.PROGRESSIVE) {
        ss.scans = 5;
    }
    ss.matte = MatteType.NONE;
    activeDocument.saveAs(saveName, ss, true, Extension.LOWERCASE);
}

// Function to place and stretch an image to fit the entire canvas
function placeImage(file: File): void {
    // Open the image file
    const imgFile = new File(file);
    const img = app.open(imgFile);

    // Copy the image
    img.selection.selectAll();
    img.selection.copy();
    img.close(SaveOptions.DONOTSAVECHANGES);

    // Paste the image into the active document (mockup)
    app.activeDocument.paste();
    const pastedImage = app.activeDocument.activeLayer;

    // Get the dimensions of the canvas
    const canvasWidth = app.activeDocument.width.as("px");
    const canvasHeight = app.activeDocument.height.as("px");

    // Stretch the image to fit the canvas
    const bounds = [0, 0, canvasWidth, canvasHeight];
    pastedImage.resize(bounds[2] / pastedImage.bounds[2] * 100, bounds[3] / pastedImage.bounds[3] * 100);
    pastedImage.translate(-pastedImage.bounds[0], -pastedImage.bounds[1]);
}

// Function to go through layers
function goThroughLayers(parentLayer: any): void {
    for (let i = 0; i < parentLayer.layers.length; i++) {
        replaceLayer = parentLayer.layers[i];
        if (replaceLayer.typename === 'LayerSet') {
            goThroughLayers(replaceLayer);
        } else {
            if (replaceLayer.name === replaceName) {
                app.activeDocument.activeLayer = replaceLayer;
                break;
            }
        }
    }
}

// Adjusted Function to process all mockups with PNG file name
function processMockup(pngFile: File, outputFolderPath: string, mockupFolderPath: string): void {
    const pngFileName = pngFile.name.replace(/\.[^\.]+$/, ''); // Store PNG file name without extension

    const mockupFolder = new Folder(mockupFolderPath);
    const mockupFiles = mockupFolder.getFiles("*.psd");

    for (let i = 0; i < mockupFiles.length; i++) {
        try {
            const mockupDocument = app.open(mockupFiles[i]);
            const originalMockupDoc = app.activeDocument;

            goThroughLayers(originalMockupDoc);
            app.runMenuItem(stringIDToTypeID('placedLayerEditContents'));

            // Correctly handle the document reference for the placed image
            const placedDoc = app.activeDocument;

            placeImage(pngFile);

            // Save and close the placed image document, ensuring changes are applied
            placedDoc.save();
            placedDoc.close(SaveOptions.SAVECHANGES);

            // Reactivate the original mockup document to continue processing
            app.activeDocument = originalMockupDoc;

            // Optionally, merge or flatten the layers as needed
            originalMockupDoc.flatten();

            // Save the JPEG with the PNG file name in the specified output folder
            createFolder(outputFolderPath);
            saveJPG01(outputFolderPath, pngFileName); // Save JPG in the output folder with the PNG file name

            // Close the mockup document without saving changes to it
            originalMockupDoc.close(SaveOptions.DONOTSAVECHANGES);
        } catch (e) {
            alert(`Error processing ${mockupFiles[i].name}: ${e.description}`);
            continue;
        }
    }
}

// Adjustments in the main function to call processMockup without mockupNumber
function main(): void {
    const pngFolder = new Folder(`${scriptPath}/png files/`);
    const pngFiles = pngFolder.getFiles("*.png");

    const outputFolderPath = `${scriptPath}/output`;

    createFolder(outputFolderPath);

    for (let a = 0; a < pngFiles.length; a++) {
        // Process each PNG file
        const mockupTypePath = `${scriptPath}/mockup_pierwszy/`; // Assuming single mockup type for simplicity
        processMockup(pngFiles[a], outputFolderPath, mockupTypePath);
    }
    alert("Processing Complete");
}

main();
