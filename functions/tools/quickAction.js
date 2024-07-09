// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const admin = require("firebase-admin");
const { https, logger } = require("firebase-functions");

// Get 3 random suggestions from the database
exports.getSuggestions = https.onCall(async (data, context) => {
    try {
      const db = await admin.firestore().collection("actions"); 
      const suggestNum = 6; // This depends on the total number of suggestions in db
      // pick up 3 random suggestions from the data
      let res = [];
      let indexArr = [];
      let docRef = db.doc("action").get();
      for (let i = 0; i < 3; i++) {
        let idx = Math.floor(Math.random() * suggestNum) + 1;
        while (indexArr.includes(idx)) { // repeat until there is new random number generated
          idx = Math.floor(Math.random() * suggestNum) + 1;
        }
        indexArr.push(idx);
        res.push((await docRef).get(idx.toString()));
      }

      logger.log("Suggestions successfully fetched");
      return { status: "success", result: res };
    } catch (error) {
      logger.error("Error fetching suggestion: ", error);
      throw new functions.https.HttpsError(
          "unknown",
          "An error occurred while fetching the suggestion",
          error.message,
      );
    }
  }
);
  
  