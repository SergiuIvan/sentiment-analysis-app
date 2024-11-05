const AWS = require("aws-sdk");
const fs = require("fs");

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const comprehend = new AWS.Comprehend();
const sentimentResults = [];

// Function to analyze sentiment of a single review
async function analyzeReview(review) {
  try {
    const params = {
      LanguageCode: "en",
      Text: review,
    };
    const result = await comprehend.detectSentiment(params).promise();

    console.log(`Review: ${review}`);
    console.log(`Sentiment: ${result.Sentiment}`);
    console.log(`SentimentScore: ${JSON.stringify(result.SentimentScore)}`);
    console.log();

    return {
      review: review,
      sentiment: result.Sentiment,
      sentimentScore: result.SentimentScore,
    };
  } catch (error) {
    console.error("Error analyzing text:", error);
    return null;
  }
}

// Function to read and process the JSON file
async function analyzeReviewsFromJSON(filePath) {
  try {
    const reviews = JSON.parse(fs.readFileSync(filePath, "utf8"));

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i].review;
      const result = await analyzeReview(review);
      if (result) {
        sentimentResults.push(result);
      }
    }

    // Save all review results to JSON file
    saveReviewResultsToFile("sentiment_results_aws.json", sentimentResults);
  } catch (error) {
    console.error("Error reading or processing JSON file:", error);
  }
}

// Function to save all review results to JSON file
function saveReviewResultsToFile(filename, results) {
  try {
    fs.writeFileSync(filename, JSON.stringify(results, null, 2), "utf8");
    console.log(`Review results saved to ${filename}`);
  } catch (error) {
    console.error("Error saving review results:", error);
  }
}

// Start analyzing reviews from the JSON file
analyzeReviewsFromJSON("sentiment_results_azure.json");
