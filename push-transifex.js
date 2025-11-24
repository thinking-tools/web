import txDomPkg from '@transifex/dom';
import txNativePkg from '@transifex/native';
import jsdomPkg from 'jsdom';
import fs from 'fs';
import dotenv from 'dotenv';

const { TxNativeDOM } = txDomPkg;
const { createNativeInstance } = txNativePkg;
const { JSDOM } = jsdomPkg;

// Load environment variables
dotenv.config();

async function push() {
  try {
    // Validate environment variables
    if (!process.env.TRANSIFEX_API_TOKEN) {
      throw new Error('TRANSIFEX_API_TOKEN is not set in environment variables');
    }

    if (!process.env.TRANSIFEX_API_SECRET) {
      throw new Error('TRANSIFEX_API_SECRET is not set in environment variables');
    }

    console.log('🚀 Starting Transifex push...\n');

    // Create a Transifex Native instance
    const tx = createNativeInstance({
      token: process.env.TRANSIFEX_API_TOKEN,
      secret: process.env.TRANSIFEX_API_SECRET,
    });

    // Create a TxNativeDOM instance
    const txdom = new TxNativeDOM();

    // Check if file exists
    const htmlFile = process.argv[2] || 'index.html';
    if (!fs.existsSync(htmlFile)) {
      throw new Error(`File not found: ${htmlFile}`);
    }

    // Read HTML file
    console.log(`📄 Reading ${htmlFile}...`);
    const html = fs.readFileSync(htmlFile, 'utf8');

    // Create a jsdom instance
    const jsdom = new JSDOM(html);

    // Attach the document node to the TxNativeDOM instance
    txdom.attachDOM(jsdom.window.document);

    // Get extracted strings
    const stringsData = txdom.getStringsJSON();

    if (!stringsData || Object.keys(stringsData).length === 0) {
      console.warn('⚠️  No translatable strings found in HTML.');
      console.warn('   Make sure your HTML has text content in elements.');
      process.exit(0);
    }

    const stringCount = Object.keys(stringsData).length;
    console.log(`✓ Found ${stringCount} translatable strings\n`);

    // Show first few strings
    console.log('Sample strings:');
    Object.entries(stringsData)
      .slice(0, 5)
      .forEach(([key, value]) => {
        const text = value.string || key;
        console.log(`  "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
      });
    if (stringCount > 5) {
      console.log(`  ... and ${stringCount - 5} more\n`);
    }

    // Push source content to Transifex
    console.log('\n📤 Pushing strings to Transifex...');
    await tx.pushSource(stringsData);

    console.log('✅ Successfully pushed strings to Transifex!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
      console.error('Details:', error.response.data);
    }

    process.exit(1);
  }
}

// Run the push function
push();
