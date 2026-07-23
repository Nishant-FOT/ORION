const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('./index.html', 'utf8');
const match = html.match(/<!-- Tailwind Config -->\s*<script[^>]*>([\s\S]*?)<\/script>/);

if (!match) {
  throw new Error('Tailwind theme configuration was not found in index.html');
}

const sandbox = { tailwind: {} };
vm.runInNewContext(match[1], sandbox);

module.exports = {
  ...sandbox.tailwind.config,
  content: ['./index.html', './src/**/*.{ts,tsx}'],
};
