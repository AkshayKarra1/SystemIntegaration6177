const express = require("express");
const {
  ComputerVisionClient,
} = require("@azure/cognitiveservices-computervision");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");

const fs = require('fs');
const dotenv = require('dotenv');

// Load configuration from config.json
const rawConfig = fs.readFileSync('./config.json');
const config = JSON.parse(rawConfig);

// Set environment variables
process.env.COGNITIVE_SERVICES_API_KEY = config.COGNITIVE_SERVICES_API_KEY;
process.env.COGNITIVE_SERVICES_ENDPOINT = config.COGNITIVE_SERVICES_ENDPOINT;
process.env.PORT = config.PORT;

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Azure Cognitive Services API key and endpoint
const apiKey = process.env.COGNITIVE_SERVICES_API_KEY;
const endpoint = process.env.COGNITIVE_SERVICES_ENDPOINT;

// Check if API key and endpoint are provided
if (!apiKey || !endpoint) {
  console.error(
    "Please provide valid API key and endpoint in environment variables."
  );
  process.exit(1);
}

// Create a Computer Vision client
const credentials = new ApiKeyCredentials({
  inHeader: { "Ocp-Apim-Subscription-Key": apiKey },
});
const client = new ComputerVisionClient(credentials, endpoint);

// Define a route to analyze the image
app.get("/analyzeImage", async (req, res) => {
  try {
    // Replace 'DIRECT_IMAGE_URL' with the actual direct link to the image you want to analyze
    const imageUrl = req.query.imageUrl || "DIRECT_IMAGE_URL";

    if (!imageUrl || imageUrl === "DIRECT_IMAGE_URL") {
      return res.status(400).json({ error: "Invalid image URL provided." });
    }

    // Analyze the image with additional visual features
    const result = await client.analyzeImage(imageUrl, {
      visualFeatures: [
        "Categories",
        "Description",
        "Color",
        "Faces",
        "Adult",
        "Tags",
        "ImageType",
        "Objects",
        "Brands",
      ],
    });

    res.json({ result });
  } catch (error) {
    let errorMessage = `Error analyzing image: ${error.message}`;

    // Handle specific error scenarios
    if (error.statusCode === 401) {
      errorMessage = "Error: Invalid API key.";
    } else if (error.statusCode === 403) {
      errorMessage = "Error: Access denied. Check your API key and endpoint.";
    } else if (error.code && error.code === "InvalidImageSize") {
      errorMessage = "Error analyzing image: Input image is too large.";
    }

    res.status(error.statusCode || 500).json({ error: errorMessage });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
