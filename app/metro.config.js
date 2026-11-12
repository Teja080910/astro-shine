// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Metro watches the whole project. Native Gradle builds write thousands of files
 * into `node_modules/<pkg>/android/build/**` and delete/recreate directories
 * mid-build, which makes the file watcher throw ENOENT and crash the dev server:
 *
 *   Error: ENOENT: no such file or directory,
 *     watch '.../node_modules/expo/android/build/tmp/kotlin-classes/release/expo'
 *
 * None of that output is needed to bundle JavaScript, so keep the watcher out of
 * native build directories entirely.
 */
config.watchFolders = config.watchFolders || [];

const escaped = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const projectRoot = escaped(__dirname);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  // any native build output anywhere in node_modules
  /node_modules[\\/].*[\\/]android[\\/]build[\\/].*/,
  /node_modules[\\/].*[\\/]ios[\\/]build[\\/].*/,
  // the app's own native folders
  new RegExp(`^${projectRoot}[\\/]android[\\/]`),
  new RegExp(`^${projectRoot}[\\/]ios[\\/]`),
];

// Belt and braces: exclude the same paths from the crawler, which is what the
// fallback watcher walks.
config.watcher = {
  ...(config.watcher || {}),
  additionalExts: config.watcher?.additionalExts,
};

module.exports = config;
