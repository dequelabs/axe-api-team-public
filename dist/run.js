"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function run(core, existsSync, readFileSync) {
    try {
        let fileData;
        const lernaFilePath = 'lerna.json';
        const packageFilePath = 'package.json';
        core.info(`Getting package version...`);
        if (existsSync(lernaFilePath)) {
            fileData = JSON.parse(readFileSync(lernaFilePath, 'utf-8'));
        }
        else if (existsSync(packageFilePath)) {
            fileData = JSON.parse(readFileSync(packageFilePath, 'utf-8'));
        }
        else {
            throw new Error('The file with the package version is not found');
        }
        const version = fileData.version;
        core.info(`Found version: ${version}. Setting "version" output...`);
        core.setOutput('version', version);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
exports.default = run;
//# sourceMappingURL=run.js.map