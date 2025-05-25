const fs = require('fs');
const path = require('path');

const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'uploads' && entry.name !== '.git') {
        copyDir(srcPath, destPath);
      }
    } else {
      // Skip server.js as we'll create a Firebase-specific one
      if (!entry.name.includes('.log') && 
          entry.name !== '.DS_Store' && 
          entry.name !== 'server.js') {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
};

// Clean existing copied files in functions (except index.js and package.json)
const cleanFunctions = () => {
  const functionsDir = './functions';
  const entries = fs.readdirSync(functionsDir, { withFileTypes: true });
  
  for (let entry of entries) {
    if (entry.isDirectory() && 
        entry.name !== 'node_modules' && 
        entry.name !== '.git') {
      fs.rmSync(path.join(functionsDir, entry.name), { recursive: true, force: true });
    }
  }
};

console.log('Cleaning functions directory...');
cleanFunctions();

console.log('Copying backend files to functions directory...');

// Copy all necessary folders
const foldersToCopy = ['routes', 'models', 'controllers', 'config', 'services', 'middleware'];

foldersToCopy.forEach(folder => {
  const srcPath = `./backend/${folder}`;
  const destPath = `./functions/${folder}`;
  
  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${folder}...`);
    copyDir(srcPath, destPath);
  } else {
    console.log(`Folder ${folder} not found, skipping...`);
  }
});

// Merge package.json dependencies
if (fs.existsSync('./backend/package.json')) {
  const backendPackage = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
  const functionsPackagePath = './functions/package.json';
  
  if (fs.existsSync(functionsPackagePath)) {
    const functionsPackage = JSON.parse(fs.readFileSync(functionsPackagePath, 'utf8'));
    
    // Merge dependencies, keeping Firebase ones priority
    functionsPackage.dependencies = {
      ...backendPackage.dependencies,
      ...functionsPackage.dependencies,
      // Ensure Firebase dependencies
      'firebase-admin': functionsPackage.dependencies['firebase-admin'] || '^11.8.0',
      'firebase-functions': functionsPackage.dependencies['firebase-functions'] || '^4.3.1'
    };
    
    fs.writeFileSync(functionsPackagePath, JSON.stringify(functionsPackage, null, 2));
    console.log('Dependencies merged into functions/package.json');
  }
}

console.log('All backend files copied successfully to Firebase Functions structure!');