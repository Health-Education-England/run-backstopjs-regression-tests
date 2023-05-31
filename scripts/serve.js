/**
 * Parses .env testing serve command and executes.
 */

require('dotenv').config({path: '../.env'})
const { spawn } = require('child_process');

// Store BACKSTOP_CLI_SERVE entry from .env file.
const serveCmd = process.env.BACKSTOP_CLI_SERVE;

if (!serveCmd || serveCmd.trim() === '') {
  throw new Error('BACKSTOP_CLI_SERVE env variable not set.')
}

// Execute CLI serve command and handle message stream.
const serveProcess = spawn(serveCmd, [], { shell: true });

serveProcess.stdout.on('data', data => {
  console.log(`stdout: ${data}`);
});

serveProcess.stderr.on('data', data => {
  console.log(`stderr: ${data}`);
});

serveProcess.on('error', (error) => {
  console.log(`error: ${error.message}`);
});

serveProcess.on('close', code => {
  console.log(`child process exited with code ${code}`);
});
