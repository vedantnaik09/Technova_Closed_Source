require('dotenv').config();  // Load environment variables from .env file
const { MongoClient } = require('mongodb');
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Path to the log file
const logFile = path.join(
  process.env.APPDATA || process.env.HOME || "C://",
  "metrics.json"
);
console.log(logFile);

const uri = process.env.MONGODB_URI;  // Mongo URI from the .env file
const dbName = 'test';
const collectionName = 'logs';

console.log(uri);

// Predefined constants
const ROLLING_WINDOW_MS = 12000; // Rolling window duration (30 seconds)
const CHECK_INTERVAL_MS = 6000; // Check interval (6 seconds)
const LOW_ACTIVITY_THRESHOLD = 20; // Minimum changes in a window to avoid low activity notification
const INTERVAL_TO_MONGO = 12000;  // Interval to insert data to MongoDB (30 seconds)

// Function to load data from the metrics file
function loadDataFromFile() {
  try {
    // Read the file synchronously
    const data = fs.readFileSync(logFile, 'utf8');
    fs.writeFileSync(logFile, '');  // Clear the file after reading
    console.log(`[${data}]`) // Wrap the content in square brackets
    
    // Parse the JSON content and return it
    return JSON.parse(`[${data.slice(0, -2)}]`);
  } catch (err) {
    // If an error occurs (e.g., file not found or empty), log the error
    console.error('Error reading the file:', err);
    return [];  // Return an empty array in case of error
  }
}


// Function to connect to MongoDB
async function connectToMongo() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');
  return client;
}


// Function to insert data into MongoDB
async function insertDataToMongo(data : Array<Object>) {
  let client;
  try {
    client = await connectToMongo();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const result = await collection.insertMany(data);
    console.log(`${result.insertedCount} documents were inserted`);
    return result.acknowledged;
  } catch (err) {
    console.error('Error inserting data:', err);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("Extension activated!");

  const employeeIDKey = "employeeID";
  const employeeID = context.globalState.get<string>(employeeIDKey);

  // Prompt for Employee ID if not already set
  if (!employeeID) {
    const input = await vscode.window.showInputBox({
      prompt: "Please enter your Employee ID:",
      placeHolder: "e.g., 12345",
      validateInput: (text) => {
        return text.trim() === "" ? "Employee ID cannot be empty" : null;
      }, 
    });

    if (input) {
      await context.globalState.update(employeeIDKey, input);
      vscode.window.showInformationMessage(`Employee ID saved: ${input}`);
    } else {
      vscode.window.showErrorMessage("Employee ID setup cancelled.");
      return;
    }
  }

  // Object to store changes aggregated over the rolling window
  let rollingChanges: Record<
    string,
    { repo: string | null; remoteUrl: string | null; changes: number }
  > = {};
  let inactivityCheckCount = 0;
  // Function to get repository details (name and remote URL)
  const getRepoDetails = (
    filePath: string
  ): { repo: string | null; remoteUrl: string | null } => {
    const gitExtension = vscode.extensions.getExtension("vscode.git");
    if (!gitExtension) {
      return { repo: null, remoteUrl: null }; // Git extension not available
    }

    const gitAPI = gitExtension.exports.getAPI(1); // Get Git API (version 1)
    for (const repo of gitAPI.repositories) {
      if (filePath.startsWith(repo.rootUri.fsPath)) {
        const remoteUrl = repo.state.remotes[0]?.fetchUrl || null; // Get the first remote URL
        return { repo: path.basename(repo.rootUri.fsPath), remoteUrl };
      }
    }

    return { repo: null, remoteUrl: null }; // Not part of any repository
  };

  // Listener for text document changes
  const changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    const filePath = event.document.fileName;
    const changes = event.contentChanges.reduce(
      (sum, change) => sum + change.text.length,
      0
    );
    const { repo, remoteUrl } = getRepoDetails(filePath);

    if (!rollingChanges[filePath]) {
      rollingChanges[filePath] = { repo, remoteUrl, changes: 0 };
    }
    rollingChanges[filePath].changes += changes;
    inactivityCheckCount += changes;
  });

  // Save metrics function
  const saveMetrics = () => {
    const totalChanges = Object.values(rollingChanges).reduce(
      (sum, file) => sum + file.changes,
      0
    );

    const data = {
      employeeID: context.globalState.get(employeeIDKey),
      timestamp: new Date().toISOString(),
      files: Object.entries(rollingChanges).map(
        ([filePath, { repo, remoteUrl, changes }]) => ({
          filePath,
          repo: repo || "None",
          remoteUrl: remoteUrl || "None",
          changes,
        })
      ),
      totalChanges,
    };

    if (Object.keys(rollingChanges).length > 0 || true) {
      fs.appendFileSync(logFile, JSON.stringify(data) + ",\n");
    }

    // console.log(`Metrics logged: ${JSON.stringify(data, null, 2)}`);
    return totalChanges;
  };

  // Timer to log productivity and check for low activity
  const interval = setInterval(() => {
    saveMetrics();
    rollingChanges = {}; // Reset rolling changes
  }, CHECK_INTERVAL_MS); // Check at intervals

  const inactivityCheckinterval = setInterval(() => {
    // Notify if activity is below threshold
    if (inactivityCheckCount < LOW_ACTIVITY_THRESHOLD) {
      vscode.window.showInformationMessage(
        "It seems your activity has been low recently. Consider taking a short break!"
      );
    }
  }, ROLLING_WINDOW_MS); // Check at intervals

  const mongoInterval = setInterval(async () => {
    // Load the existing data from the metrics file
    const data = loadDataFromFile();
    if (data.length > 0) {
      // Insert the data into MongoDB
      const success = await insertDataToMongo(data);
      
      // Only clear the file if insertion was successful
      if (success) {
        fs.writeFileSync(logFile, '');
        console.log('Data successfully inserted to MongoDB and file cleared');
      } else {
        console.log('Failed to insert data to MongoDB, keeping file content');
      }
      fs.writeFileSync(logFile, '');
    } else {
      console.log('No data to insert');
    }
  }, INTERVAL_TO_MONGO);  // 1 hour in milliseconds

  // Command to manually enter Employee ID
  const disposable = vscode.commands.registerCommand(
    "prod-tracker.enterEmployeeId",
    async () => {
      console.log("Command triggered: enterEmployeeId");

      const input = await vscode.window.showInputBox({
        prompt: "Please enter your Employee ID:",
        placeHolder: "e.g., 12345",
        validateInput: (text) => {
          return text.trim() === "" ? "Employee ID cannot be empty" : null;
        },
      });

      if (input) {
        await context.globalState.update(employeeIDKey, input);
        vscode.window.showInformationMessage(`Employee ID saved: ${input}`);
      } else {
        vscode.window.showErrorMessage("Employee ID input cancelled.");
      }
    }
  );

  // Register disposables
  context.subscriptions.push(changeListener);
  context.subscriptions.push(disposable);
  context.subscriptions.push({
    dispose: () => {
      clearInterval(interval);
      clearInterval(inactivityCheckinterval);
      clearInterval(mongoInterval);
    },
  });
}

export function deactivate() {
  console.log("Extension deactivated!");
}
