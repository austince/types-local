import "chai";
import {expect} from "chai";
import * as fs from "fs";
import "mocha";
import * as os from "os";
import * as path from "path";
import * as process from "process";
import * as rimraf from "rimraf";
import * as TypesLocal from "../lib/index";

function createTempDir() {
    const dirName = path.join(os.tmpdir(), (Math.random() * 12345).toString());
    fs.mkdirSync(dirName);
    return dirName;
}

describe("TypesLocal", () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
        process.chdir(tempDir);
        fs.writeFileSync("tsconfig.json", "{}");
    });

    afterEach(() => {
        rimraf.sync(tempDir);
    });

    it("createTypesLocalPackage", () => {
        TypesLocal.createTypesLocalPackage("mkdirp");

        const dir = (path.join("types-local", "mkdirp"));
        expect(fs.existsSync(dir)).to.be.true;
        expect(fs.existsSync(path.join(dir, "index.d.ts")));
        const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json")).toString());
        expect(packageJson.name).to.eq("@types/mkdirp");
        expect(packageJson.typings).to.eq("index.d.ts");
        expect(packageJson.version).to.not.undefined;
        expect(packageJson.description).to.not.undefined;
        const tsConfigJson = fs.readFileSync("tsconfig.json").toString();
        expect(tsConfigJson).to.eq(`{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "mkdirp": [
                "types-local/mkdirp"
            ]
        }
    }
}`);
        const tsConfig = JSON.parse(tsConfigJson);
        expect(tsConfig.compilerOptions.baseUrl).to.not.undefined;
        expect(tsConfig.compilerOptions.paths).to.not.undefined;
        expect(tsConfig.compilerOptions.paths.mkdirp).to.eql(["types-local/mkdirp"]);
    });

    it("createTypesLocalPackage for multiple modules", () => {
        const modules: string[] = ["mkdirp", "dts-gen"];
        TypesLocal.createTypesLocalPackage(modules);

        const tsConfigJson = fs.readFileSync("tsconfig.json").toString();
        const tsConfig = JSON.parse(tsConfigJson);

        for (const module of modules) {
            // Check each package.json
            const dir = (path.join("types-local", module));
            expect(fs.existsSync(dir)).to.be.true;
            expect(fs.existsSync(path.join(dir, "index.d.ts")));
            const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json")).toString());
            expect(packageJson.name).to.eq(`@types/${module}`);
            expect(packageJson.typings).to.eq("index.d.ts");
            expect(packageJson.version).to.not.be.undefined;
            expect(packageJson.description).to.not.be.undefined;

            // Check each for a tsConfig entry
            expect(tsConfig.compilerOptions.baseUrl).to.not.undefined;
            expect(tsConfig.compilerOptions.paths).to.not.undefined;
            expect(tsConfig.compilerOptions.paths[module]).to.eql([`types-local/${module}`]);
        }
    });

    it("removeTypesLocalPackage", () => {
        TypesLocal.createTypesLocalPackage("mkdirp");
        TypesLocal.removeTypesLocalPackage("mkdirp");
        const dir = (path.join("types-local", "mkdirp"));
        expect(fs.existsSync(dir)).to.be.false;
        expect(fs.existsSync("types-local")).to.be.false;
        const tsConfigJson = fs.readFileSync("tsconfig.json").toString();
        expect(tsConfigJson).to.eq(`{
    "compilerOptions": {}
}`);
    });
});
