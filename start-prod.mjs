import { spawn } from 'child_process';

console.log('--- Starting Production Services ---');
const port = process.env.PORT || '3000';
console.log(`Railway PORT is: ${port}`);
console.log('Express API will run on inner port: 3001');

// 1. Start Express API Backend (on dynamic INTERNAL_PORT)
const internalPort = process.env.INTERNAL_PORT || '3001';
const apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true, // Needs shell for npx resolution on some systems
    env: { ...process.env, INTERNAL_PORT: internalPort } // Pass internal port down to Express
});

apiProcess.on('close', (code) => {
    console.error(`[FATAL] Express API process exited with code ${code}`);
    process.exit(code || 1);
});

// 2. Start Next.js Frontend (on Railway PORT)
const nextProcess = spawn('npx', ['next', 'start', '-p', port, '-H', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env } // Next.js gets the real $PORT
});

nextProcess.on('close', (code) => {
    console.error(`[FATAL] Next.js process exited with code ${code}`);
    process.exit(code || 1);
});

// Forward termination signals to children
const cleanup = () => {
    console.log('Shutting down processes gracefully...');
    apiProcess.kill('SIGTERM');
    nextProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
