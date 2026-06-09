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

// Add extraNodeModules for monorepo consistency
config.resolver.extraNodeModules = {
  'expo-media-library': path.resolve(projectRoot, 'node_modules/expo-media-library'),
  'expo-image': path.resolve(projectRoot, 'node_modules/expo-image'),
  'expo-blur': path.resolve(projectRoot, 'node_modules/expo-blur'),
  'expo-linear-gradient': path.resolve(projectRoot, 'node_modules/expo-linear-gradient'),
};

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

  // Explicit resolution for expo packages that often fail in pnpm monorepos
  const expoPackages = ['expo-media-library', 'expo-image', 'expo-blur', 'expo-linear-gradient'];
  if (expoPackages.includes(moduleName)) {
    try {
      const packageJsonPath = path.resolve(projectRoot, 'node_modules', moduleName, 'package.json');
      const pkg = require(packageJsonPath);
      const main = pkg.main || 'index.js';
      const targetPath = path.resolve(projectRoot, 'node_modules', moduleName, main);
      
      console.log(`[Metro Resolver] Manually resolving ${moduleName} to ${targetPath}`);
      
      return {
        filePath: targetPath,
        type: 'sourceFile',
      };
    } catch (e) {
      console.log(`[Metro Resolver] Failed to manually resolve ${moduleName}: ${e.message}`);
    }
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
  /.*_tmp_.*/, // Block temporary folders that pnpm creates
  
  // Use more specific patterns for project-level folders to avoid blocking node_modules
  new RegExp(path.resolve(projectRoot, 'dist').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(projectRoot, 'glassProfile').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(workspaceRoot, 'server').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(workspaceRoot, 'client').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(workspaceRoot, 'client-user').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(workspaceRoot, 'nginx').replace(/\\/g, '\\\\')),
];

module.exports = withNativeWind(config, { 
  input: './src/app/global.css',
  forceWriteFileSystem: true,
});
