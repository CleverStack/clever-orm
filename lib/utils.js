exports.supportSingleModule = function( env, moduleName ) {
    if ( moduleName ) {
        env.packageJson.bundledDependencies.length = 0
        env.packageJson.bundledDependencies.push( 'clever-orm', env );
        env.packageJson.bundledDependencies.push( moduleName, env );
    }
}