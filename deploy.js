const { execSync } = require('child_process');

console.log("Running build-index.js...");
try {
    execSync('node build-index.js', { stdio: 'inherit' });
    console.log("Deploying to Vercel...");
    execSync('npx vercel --prod --yes', { stdio: 'inherit' });
    console.log("Deployment complete.");
} catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
}
