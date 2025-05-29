const fs = require("fs");
const path = require("path");

// Configuration
const TRANSLATIONS_DIR = "./assets/translations";
const BUILD_DIR = "./docs";
const TEMPLATE_FILE = "./index.html";

// Create build directory if it doesn't exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read and parse translation files
function getTranslations() {
  const translations = {};
  const files = fs.readdirSync(TRANSLATIONS_DIR);

  files.forEach((file) => {
    if (file.endsWith(".json")) {
      const lang = path.basename(file, ".json");
      const content = fs.readFileSync(
        path.join(TRANSLATIONS_DIR, file),
        "utf8",
      );
      translations[lang] = JSON.parse(content);
    }
  });

  return translations;
}

// Simple HTML processing - replace elements with data-i18n-key
function replaceTranslations(html, translations, lang) {
  // Handle meta tags
  html = html.replace(
    /<meta([^>]*?)data-i18n-key="([^"]+)"([^>]*?)>/g,
    (match, before, key, after) => {
      if (!translations[key]) {
        console.warn(
          `⚠️  Missing translation for key "${key}" in language "${lang}"`,
        );
      }
      const value = translations[key] || key;

      // Check if it's a content attribute
      if (
        match.includes('name="description"') ||
        match.includes('property="og:description"')
      ) {
        return `<meta${before}data-i18n-key="${key}"${after.replace(/content="[^"]*"/, `content="${value}"`)}>`;
      }

      return match;
    },
  );

  // Handle title tag
  html = html.replace(
    /<title[^>]*data-i18n-key="([^"]+)"[^>]*>.*?<\/title>/g,
    (match, key) => {
      if (!translations[key]) {
        console.warn(
          `⚠️  Missing translation for key "${key}" in language "${lang}"`,
        );
      }
      const value = translations[key] || key;
      return `<title data-i18n-key="${key}">${value}</title>`;
    },
  );

  // Handle all elements with data-i18n-key using a more robust approach
  const regex = /<(\w+)([^>]*?data-i18n-key="([^"]+)"[^>]*?)>([\s\S]*?)<\/\1>/g;
  html = html.replace(regex, (match, tag, attributes, key, content) => {
    if (!translations[key]) {
      console.warn(
        `⚠️  Missing translation for key "${key}" in language "${lang}"`,
      );
    }
    const value = translations[key] || key;
    // Preserve the original formatting of attributes
    return `<${tag}${attributes}>${value}</${tag}>`;
  });

  // Handle html lang attribute
  if (translations.htmlLang) {
    html = html.replace(
      /<html([^>]*?)lang="[^"]*"/,
      `<html$1lang="${translations.htmlLang}"`,
    );
  }

  return html;
}

// Main build function
function build() {
  console.log("🔨 Starting build process...\n");

  // Ensure build directory exists
  ensureDir(BUILD_DIR);

  // Read template
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  // Get all translations
  const translations = getTranslations();

  // Process each language
  Object.entries(translations).forEach(([lang, strings]) => {
    console.log(`\n📝 Processing language: ${lang}`);

    // Replace translations in template
    const processed = replaceTranslations(template, strings, lang);

    // Determine output path
    let outputPath;
    if (lang === "en") {
      outputPath = path.join(BUILD_DIR, "index.html");
    } else {
      const langDir = path.join(BUILD_DIR, lang);
      ensureDir(langDir);
      outputPath = path.join(langDir, "index.html");
    }

    // Write file
    fs.writeFileSync(outputPath, processed);
    console.log(`✅ Generated: ${outputPath}`);
  });

  // Copy assets
  console.log("\n📁 Copying assets...");
  const assetsSource = "./assets";
  const assetsDest = path.join(BUILD_DIR, "assets");
  if (fs.existsSync(assetsSource)) {
    copyDir(assetsSource, assetsDest);
    console.log("✅ Assets copied to build folder");
  } else {
    console.log("⚠️  No assets folder found to copy");
  }

  console.log("\n🎉 Build complete!");
}

// Helper function to copy directory
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run build
build();
