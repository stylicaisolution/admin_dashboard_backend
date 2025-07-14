import path from "path";
import sharp from 'sharp';
import fs from 'fs'

export const convertToWebP = async (inputFilePath) => {
  try {

    const outputFilePath = path.join(path.dirname(inputFilePath), "front.webp");

    // Convert image to WebP using sharp
    await sharp(inputFilePath)
      .webp({ quality: 80 }) // Set quality if needed
      .toFile(outputFilePath);
    
    fs.unlink(inputFilePath, (err) => {
        if (err) {
          console.error("Error deleting the original file:", err);
        }
    });

    return outputFilePath;
  } catch (err) {
    console.error("Error renaming file to front.webp:", err);
    throw new Error("Renaming file to front.webp failed.");
  }
};

export const convertToWebPBackImage = async (inputFilePath) => {
  try{
    const outputFilePath = path.join(path.dirname(inputFilePath), "back.webp");

    // Convert image to WebP using sharp
    await sharp(inputFilePath)
      .webp({ quality: 80 }) // Set quality if needed
      .toFile(outputFilePath);
    
    fs.unlink(inputFilePath, (err) => {
        if (err) {
          console.error("Error deleting the original file:", err);
        }
    });

    return outputFilePath;
  }catch(err){
    console.error("Error renaming file to front.webp:", err);
    throw new Error("Renaming file to front.webp failed.");
  }
}

export const convertToWebpPhotoshoot = async (inputFilePath) =>{
   try{
     const outputFilePath = path.join(path.dirname(inputFilePath), `photoshoot${Date.now()+Math.random()
      .toString(36)
      .substring(2, 8)}.webp`)
     
     // Convert image to Webp using sharp
     await sharp(inputFilePath)
     .webp({ quality: 80 }) // Set quality if needed
     .toFile(outputFilePath);

     fs.unlink(inputFilePath, (err) => {
      if (err) {
        console.error("Error deleting the original file:", err);
      }
    });

    return outputFilePath

   }catch(err){
    console.error("Error renaming file to front.webp:", err);
    throw new Error("Renaming file to front.webp failed.");
   }
}
