const {
  TextAnalyticsClient,
  AzureKeyCredential,
} = require("@azure/ai-text-analytics");
const fs = require("fs");
const csv = require("csv-parser");

// Azure Text Analytics client initialization
const key = process.env.ACCESS_KEY_AZURE;
const endpoint = process.env.ACCESS_ENDPOINT;

const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key), {
  retryOptions: { maxRetries: 3 },
  requestOptions: { timeout: 60000 },
});

// Function to analyze sentiment of a single review
async function analyzeReview(review) {
  try {
    const response = await client.analyzeSentiment(
      [{ id: "1", language: "en", text: review }],
      { includeOpinionMining: true }
    );

    const result = response[0];
    const reviewResult = {
      review: review,
      sentiment: result.sentiment,
      sentimentConfidenceScore: result.confidenceScores,
    };

    console.log(`Review: ${review}`);
    console.log(`Sentiment: ${result.sentiment}`);
    console.log(`SentimentScore: ${JSON.stringify(result.confidenceScores)}`);
    console.log();

    // Return the review result
    return reviewResult;
  } catch (error) {
    console.error("Error analyzing text:", error);
    return null; // Return null if there's an error
  }
}

// Function to read and process the CSV file
async function analyzeReviewsFromCSV(filePath) {
  let reviewResults = []; // Array to store all review results

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", async (row) => {
          const reviewTitle = row.ReviewTitle || "";
          const reviewBody = row.ReviewBody || "";
          const textToAnalyze = `${reviewTitle} ${reviewBody}`.trim();

          if (textToAnalyze) {
            const result = await analyzeReview(textToAnalyze);
            if (result) {
              reviewResults.push(result); // Push the review result to array
            }
          }
        })
        .on("end", () => {
          console.log("CSV file has been processed");
          resolve(reviewResults); // Resolve with review results array
        })
        .on("error", (error) => {
          console.error("Error processing CSV file:", error);
          reject(error);
        });
    });

    // Save all review results to JSON file
    saveReviewResultsToFile("sentiment_results_azure.json", reviewResults);
  } catch (error) {
    console.error("Error reading or processing CSV file:", error);
  }
}

// Function to save all review results to JSON file
function saveReviewResultsToFile(filename, results) {
  try {
    const jsonData = JSON.stringify(results, null, 2);
    fs.writeFileSync(filename, jsonData, "utf8");
    console.log(`Review results saved to ${filename}`);
  } catch (error) {
    console.error("Error saving review results:", error);
  }
}

// Start analyzing reviews from the CSV file
analyzeReviewsFromCSV("AllProductReviews2.csv");
