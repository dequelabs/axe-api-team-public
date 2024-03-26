"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const chai_1 = require("chai");
const exec = __importStar(require("@actions/exec"));
const run_1 = __importDefault(require("./run"));
describe('run', () => {
    let execStub;
    let inputStub;
    let setFailedSpy;
    let setOutputSpy;
    let infoSpy;
    let warningSpy;
    beforeEach(() => {
        execStub = sinon_1.default.stub(exec, 'getExecOutput');
        inputStub = sinon_1.default.stub();
        setFailedSpy = sinon_1.default.spy();
        setOutputSpy = sinon_1.default.spy();
        infoSpy = sinon_1.default.spy();
        warningSpy = sinon_1.default.spy();
    });
    afterEach(sinon_1.default.restore);
    describe('inputs', () => {
        describe('version', () => {
            describe('when not provided', () => {
                it('throws an error', async () => {
                    inputStub.withArgs('version', { required: true }).throws({
                        message: 'Input required and not supplied: version'
                    });
                    const core = {
                        getInput: inputStub,
                        setFailed: setFailedSpy
                    };
                    const github = {};
                    await (0, run_1.default)(core, github);
                    chai_1.assert.isTrue(setFailedSpy.calledOnce);
                    chai_1.assert.equal(setFailedSpy.args[0][0], 'Input required and not supplied: version');
                });
            });
        });
        describe('owner', () => {
            describe('when provided', () => {
                it('uses the provided value', async () => {
                    inputStub.withArgs('version', { required: true }).returns('1.0.0');
                    inputStub.withArgs('owner').returns('new-owner');
                    inputStub.withArgs('repo').returns('repo');
                    const core = {
                        getInput: inputStub,
                        setFailed: setFailedSpy,
                        info: infoSpy
                    };
                    const github = {
                        context: {
                            repo: {
                                owner: 'owner',
                                repo: 'repo'
                            }
                        }
                    };
                    await (0, run_1.default)(core, github);
                    chai_1.assert.isTrue(infoSpy.calledOnce);
                    chai_1.assert.equal(infoSpy.args[0][0], 'Getting issues for new-owner/repo...');
                });
            });
            describe('when not provided', () => {
                it('uses the context value', async () => {
                    inputStub.withArgs('version', { required: true }).returns('1.0.0');
                    inputStub.withArgs('owner').returns('');
                    inputStub.withArgs('repo').returns('repo');
                    const core = {
                        getInput: inputStub,
                        setFailed: setFailedSpy,
                        info: infoSpy
                    };
                    const github = {
                        context: {
                            repo: {
                                owner: 'owner',
                                repo: 'repo'
                            }
                        }
                    };
                    await (0, run_1.default)(core, github);
                    chai_1.assert.isTrue(infoSpy.calledOnce);
                    chai_1.assert.equal(infoSpy.args[0][0], 'Getting issues for owner/repo...');
                });
            });
        });
        describe('repo', () => {
            describe('when provided', () => {
                it('uses the provided value', async () => {
                    inputStub.withArgs('version', { required: true }).returns('1.0.0');
                    inputStub.withArgs('owner').returns('owner');
                    inputStub.withArgs('repo').returns('new-repo');
                    const core = {
                        getInput: inputStub,
                        setFailed: setFailedSpy,
                        info: infoSpy
                    };
                    const github = {
                        context: {
                            repo: {
                                owner: 'owner',
                                repo: 'repo'
                            }
                        }
                    };
                    await (0, run_1.default)(core, github);
                    chai_1.assert.isTrue(infoSpy.calledOnce);
                    chai_1.assert.equal(infoSpy.args[0][0], 'Getting issues for owner/new-repo...');
                });
            });
            describe('when not provided', () => {
                it('uses the context value', async () => {
                    inputStub.withArgs('version', { required: true }).returns('1.0.0');
                    inputStub.withArgs('owner').returns('owner');
                    inputStub.withArgs('repo').returns('');
                    const core = {
                        getInput: inputStub,
                        setFailed: setFailedSpy,
                        info: infoSpy
                    };
                    const github = {
                        context: {
                            repo: {
                                owner: 'owner',
                                repo: 'repo'
                            }
                        }
                    };
                    await (0, run_1.default)(core, github);
                    chai_1.assert.isTrue(infoSpy.calledOnce);
                    chai_1.assert.equal(infoSpy.args[0][0], 'Getting issues for owner/repo...');
                });
            });
        });
    });
    describe('when listing issues', () => {
        describe('throws a non-zero exit code', () => {
            it('catches the error', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('owner');
                inputStub.withArgs('repo').returns('repo');
                execStub.returns({
                    stdout: '',
                    stderr: 'BOOM',
                    exitCode: 1
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(setFailedSpy.calledOnce);
                chai_1.assert.equal(setFailedSpy.args[0][0], 'Error getting issues: \nBOOM');
            });
        });
        describe('succeeds', () => {
            it('calls gh issue list with the correct arguments', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('');
                inputStub.withArgs('repo').returns('');
                execStub.returns({
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(execStub.calledOnce);
                chai_1.assert.equal(execStub.args[0][0], 'gh issue list --repo owner/repo --label release --state open --json url,title --search "owner/repo v1.0.0"');
            });
        });
        describe('when passed owner and repo', () => {
            it('calls gh issue list with the correct arguments', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('other-owner');
                inputStub.withArgs('repo').returns('docs');
                execStub.returns({
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'actual-repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(execStub.calledOnce);
                chai_1.assert.equal(execStub.args[0][0], 'gh issue list --repo other-owner/docs --label release --state open --json url,title --search "owner/actual-repo v1.0.0"');
            });
        });
        describe('when no issues are found', () => {
            it('warns the user', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('owner');
                inputStub.withArgs('repo').returns('repo');
                execStub.returns({
                    stdout: '[]',
                    stderr: '',
                    exitCode: 0
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy,
                    warning: warningSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(warningSpy.calledOnce);
                chai_1.assert.equal(warningSpy.args[0][0], 'No issues found for owner/repo v1.0.0. It may have already been closed...');
            });
            it('sets the issue-url output to null', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('owner');
                inputStub.withArgs('repo').returns('repo');
                execStub.returns({
                    stdout: '[]',
                    stderr: '',
                    exitCode: 0
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy,
                    warning: warningSpy,
                    setOutput: setOutputSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(setOutputSpy.calledOnce);
                chai_1.assert.equal(setOutputSpy.args[0][0], 'issue-url');
                chai_1.assert.equal(setOutputSpy.args[0][1], null);
            });
        });
        describe('when more than one issue is found', () => {
            it('throws an error', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('owner');
                inputStub.withArgs('repo').returns('repo');
                execStub.returns({
                    stdout: '[{"url":"url1","title":"title1"},{"url":"url2","title":"title2"}]',
                    stderr: '',
                    exitCode: 0
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy,
                    warning: warningSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(setFailedSpy.calledOnce);
                chai_1.assert.equal(setFailedSpy.args[0][0], 'Found 2 issues for owner/repo v1.0.0. Please manually verify...');
            });
        });
        describe('when one issue is found', () => {
            it('sets the issue-url output', async () => {
                inputStub.withArgs('version', { required: true }).returns('1.0.0');
                inputStub.withArgs('owner').returns('owner');
                inputStub.withArgs('repo').returns('repo');
                execStub.returns({
                    stdout: '[{"url":"url1","title":"title1"}]',
                    stderr: '',
                    exitCode: 0
                });
                const core = {
                    getInput: inputStub,
                    info: infoSpy,
                    setFailed: setFailedSpy,
                    warning: warningSpy,
                    setOutput: setOutputSpy
                };
                const github = {
                    context: {
                        repo: {
                            owner: 'owner',
                            repo: 'repo'
                        }
                    }
                };
                await (0, run_1.default)(core, github);
                chai_1.assert.isTrue(setOutputSpy.calledOnce);
                chai_1.assert.equal(setOutputSpy.args[0][0], 'issue-url');
                chai_1.assert.equal(setOutputSpy.args[0][1], 'url1');
            });
        });
    });
    describe('when an unexpected error occurs', () => {
        it('catches the error', async () => {
            const core = {
                getInput() {
                    throw new Error('BOOM!');
                },
                setFailed: setFailedSpy
            };
            const github = {
                context: {
                    repo: {
                        owner: 'owner',
                        repo: 'repo'
                    }
                }
            };
            await (0, run_1.default)(core, github);
            chai_1.assert.isTrue(setFailedSpy.calledOnce);
            chai_1.assert.equal(setFailedSpy.args[0][0], 'BOOM!');
        });
    });
});
//# sourceMappingURL=run.test.js.map