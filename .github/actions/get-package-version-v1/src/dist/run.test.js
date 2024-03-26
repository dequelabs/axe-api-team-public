"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const chai_1 = require("chai");
const run_1 = __importDefault(require("./run"));
describe('run', () => {
    const infoSpy = sinon_1.default.spy();
    const setFailedSpy = sinon_1.default.spy();
    const setOutputSpy = sinon_1.default.spy();
    const existsSyncStub = sinon_1.default.stub();
    const readFileSyncStub = sinon_1.default.stub();
    const core = {
        info: infoSpy,
        setFailed: setFailedSpy,
        setOutput: setOutputSpy,
    };
    afterEach(sinon_1.default.resetHistory);
    it('should get a version from lerna.json', () => {
        const packageVersionMock = '1.0.0';
        existsSyncStub
            .onCall(0).returns(true)
            .onCall(1).returns(false);
        readFileSyncStub
            .returns(JSON.stringify({ version: packageVersionMock }));
        (0, run_1.default)(core, existsSyncStub, readFileSyncStub);
        chai_1.assert.isTrue(existsSyncStub.calledOnce);
        chai_1.assert.isTrue(readFileSyncStub.calledOnceWithExactly('lerna.json', 'utf-8'));
        chai_1.assert.isTrue(setOutputSpy.calledOnceWithExactly('version', packageVersionMock));
        chai_1.assert.isTrue(setFailedSpy.notCalled);
    });
    it('should get a version from package.json', () => {
        const packageVersionMock = '2.0.0';
        existsSyncStub
            .onCall(0).returns(false)
            .onCall(1).returns(true);
        readFileSyncStub
            .returns(JSON.stringify({ version: packageVersionMock }));
        (0, run_1.default)(core, existsSyncStub, readFileSyncStub);
        chai_1.assert.isTrue(existsSyncStub.calledTwice);
        chai_1.assert.isTrue(readFileSyncStub.calledOnceWithExactly('package.json', 'utf-8'));
        chai_1.assert.isTrue(setOutputSpy.calledOnceWithExactly('version', packageVersionMock));
        chai_1.assert.isTrue(setFailedSpy.notCalled);
    });
    it('should throw an error if a file is not found', () => {
        existsSyncStub
            .onCall(0).returns(false)
            .onCall(1).returns(false);
        readFileSyncStub
            .returns(null);
        (0, run_1.default)(core, existsSyncStub, readFileSyncStub);
        chai_1.assert.isTrue(existsSyncStub.calledTwice);
        chai_1.assert.isTrue(readFileSyncStub.notCalled);
        chai_1.assert.isTrue(setOutputSpy.notCalled);
        chai_1.assert.isTrue(setFailedSpy.calledOnce);
    });
});
//# sourceMappingURL=run.test.js.map