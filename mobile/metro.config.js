const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the workspace root
// This is essential for pnpm monorepos so Metro can follow symlinks to the .pnpm store
config.watchFolders = [
  projectRoot,
  workspaceRoot,
];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Enable Symlinks and Package Exports
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 4. Set maxWorkers to improve performance
config.maxWorkers = 4;

// 5. Custom resolver for monorepo and pnpm compatibility
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force resolution for expo-router/entry to ensure it's picked up correctly
  if (moduleName === 'expo-router/entry') {
    return context.resolveRequest(context, 'expo-router/entry', platform);
  }

  // Fix react-native-css-interop subpaths for NativeWind
  if (moduleName.startsWith('react-native-css-interop/')) {
    const subpath = moduleName.replace('react-native-css-interop/', '');
    if (subpath === 'jsx-runtime' || subpath === 'jsx-dev-runtime') {
      const targetPath = path.resolve(projectRoot, `node_modules/react-native-css-interop/dist/runtime/${subpath}.js`);
      return { filePath: targetPath, type: 'sourceFile' };
    }
  }
  
  // Fix whatwg-fetch if needed
  if (moduleName === 'whatwg-fetch') {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/whatwg-fetch/dist/fetch.umd.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

// 6. blockList to avoid indexing/watching irrelevant directories
// We exclude the server and other non-mobile folders to improve performance on Windows
config.resolver.blockList = [
  /.*\.log$/,
  /[\\/]\.git[\\/].*/,
  /[\\/]\.expo[\\/].*/,
  /[\\/]android[\\/].*/,
  /[\\/]ios[\\/].*/,
  /[\\/]web-build[\\/].*/,
  // Use more specific patterns for project-level folders to avoid blocking node_modules
  new RegExp(path.resolve(projectRoot, 'dist').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(projectRoot, 'glassProfile').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(workspaceRoot, 'server').replace(/\\/g, '\\\\')),
];

module.exports = withNativeWind(config, { 
  input: './src/app/global.css',
  forceWriteFileSystem: true,
});
