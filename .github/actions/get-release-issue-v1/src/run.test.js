'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb(n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.')
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
Object.defineProperty(exports, '__esModule', { value: true })
require('mocha')
var sinon_1 = require('sinon')
var chai_1 = require('chai')
var exec = require('@actions/exec')
var run_1 = require('./run')
describe('run', function () {
  var execStub
  var inputStub
  var setFailedSpy
  var setOutputSpy
  var infoSpy
  var warningSpy
  beforeEach(function () {
    execStub = sinon_1.default.stub(exec, 'getExecOutput')
    inputStub = sinon_1.default.stub()
    setFailedSpy = sinon_1.default.spy()
    setOutputSpy = sinon_1.default.spy()
    infoSpy = sinon_1.default.spy()
    warningSpy = sinon_1.default.spy()
  })
  afterEach(sinon_1.default.restore)
  describe('inputs', function () {
    describe('version', function () {
      describe('when not provided', function () {
        it('throws an error', function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var core, github
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  inputStub.withArgs('version', { required: true }).throws({
                    message: 'Input required and not supplied: version'
                  })
                  core = {
                    getInput: inputStub,
                    setFailed: setFailedSpy
                  }
                  github = {}
                  return [4 /*yield*/, (0, run_1.default)(core, github)]
                case 1:
                  _a.sent()
                  chai_1.assert.isTrue(setFailedSpy.calledOnce)
                  chai_1.assert.equal(
                    setFailedSpy.args[0][0],
                    'Input required and not supplied: version'
                  )
                  return [2 /*return*/]
              }
            })
          })
        })
      })
    })
    describe('owner', function () {
      describe('when provided', function () {
        it('uses the provided value', function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var core, github
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  inputStub
                    .withArgs('version', { required: true })
                    .returns('1.0.0')
                  inputStub.withArgs('owner').returns('new-owner')
                  inputStub.withArgs('repo').returns('repo')
                  core = {
                    getInput: inputStub,
                    setFailed: setFailedSpy,
                    info: infoSpy
                  }
                  github = {
                    context: {
                      repo: {
                        owner: 'owner',
                        repo: 'repo'
                      }
                    }
                  }
                  return [4 /*yield*/, (0, run_1.default)(core, github)]
                case 1:
                  _a.sent()
                  chai_1.assert.isTrue(infoSpy.calledOnce)
                  chai_1.assert.equal(
                    infoSpy.args[0][0],
                    'Getting issues for new-owner/repo...'
                  )
                  return [2 /*return*/]
              }
            })
          })
        })
      })
      describe('when not provided', function () {
        it('uses the context value', function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var core, github
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  inputStub
                    .withArgs('version', { required: true })
                    .returns('1.0.0')
                  inputStub.withArgs('owner').returns('')
                  inputStub.withArgs('repo').returns('repo')
                  core = {
                    getInput: inputStub,
                    setFailed: setFailedSpy,
                    info: infoSpy
                  }
                  github = {
                    context: {
                      repo: {
                        owner: 'owner',
                        repo: 'repo'
                      }
                    }
                  }
                  return [4 /*yield*/, (0, run_1.default)(core, github)]
                case 1:
                  _a.sent()
                  chai_1.assert.isTrue(infoSpy.calledOnce)
                  chai_1.assert.equal(
                    infoSpy.args[0][0],
                    'Getting issues for owner/repo...'
                  )
                  return [2 /*return*/]
              }
            })
          })
        })
      })
    })
    describe('repo', function () {
      describe('when provided', function () {
        it('uses the provided value', function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var core, github
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  inputStub
                    .withArgs('version', { required: true })
                    .returns('1.0.0')
                  inputStub.withArgs('owner').returns('owner')
                  inputStub.withArgs('repo').returns('new-repo')
                  core = {
                    getInput: inputStub,
                    setFailed: setFailedSpy,
                    info: infoSpy
                  }
                  github = {
                    context: {
                      repo: {
                        owner: 'owner',
                        repo: 'repo'
                      }
                    }
                  }
                  return [4 /*yield*/, (0, run_1.default)(core, github)]
                case 1:
                  _a.sent()
                  chai_1.assert.isTrue(infoSpy.calledOnce)
                  chai_1.assert.equal(
                    infoSpy.args[0][0],
                    'Getting issues for owner/new-repo...'
                  )
                  return [2 /*return*/]
              }
            })
          })
        })
      })
      describe('when not provided', function () {
        it('uses the context value', function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var core, github
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  inputStub
                    .withArgs('version', { required: true })
                    .returns('1.0.0')
                  inputStub.withArgs('owner').returns('owner')
                  inputStub.withArgs('repo').returns('')
                  core = {
                    getInput: inputStub,
                    setFailed: setFailedSpy,
                    info: infoSpy
                  }
                  github = {
                    context: {
                      repo: {
                        owner: 'owner',
                        repo: 'repo'
                      }
                    }
                  }
                  return [4 /*yield*/, (0, run_1.default)(core, github)]
                case 1:
                  _a.sent()
                  chai_1.assert.isTrue(infoSpy.calledOnce)
                  chai_1.assert.equal(
                    infoSpy.args[0][0],
                    'Getting issues for owner/repo...'
                  )
                  return [2 /*return*/]
              }
            })
          })
        })
      })
    })
  })
  describe('when listing issues', function () {
    describe('throws a non-zero exit code', function () {
      it('catches the error', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('owner')
                inputStub.withArgs('repo').returns('repo')
                execStub.returns({
                  stdout: '',
                  stderr: 'BOOM',
                  exitCode: 1
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(setFailedSpy.calledOnce)
                chai_1.assert.equal(
                  setFailedSpy.args[0][0],
                  'Error getting issues: \nBOOM'
                )
                return [2 /*return*/]
            }
          })
        })
      })
    })
    describe('succeeds', function () {
      it('calls gh issue list with the correct arguments', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('')
                inputStub.withArgs('repo').returns('')
                execStub.returns({
                  stdout: '',
                  stderr: '',
                  exitCode: 0
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(execStub.calledOnce)
                chai_1.assert.equal(
                  execStub.args[0][0],
                  'gh issue list --repo owner/repo --label release --state open --json url,title --search "owner/repo v1.0.0"'
                )
                return [2 /*return*/]
            }
          })
        })
      })
    })
    describe('when passed owner and repo', function () {
      it('calls gh issue list with the correct arguments', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('other-owner')
                inputStub.withArgs('repo').returns('docs')
                execStub.returns({
                  stdout: '',
                  stderr: '',
                  exitCode: 0
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'actual-repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(execStub.calledOnce)
                chai_1.assert.equal(
                  execStub.args[0][0],
                  'gh issue list --repo other-owner/docs --label release --state open --json url,title --search "owner/actual-repo v1.0.0"'
                )
                return [2 /*return*/]
            }
          })
        })
      })
    })
    describe('when no issues are found', function () {
      it('warns the user', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('owner')
                inputStub.withArgs('repo').returns('repo')
                execStub.returns({
                  stdout: '[]',
                  stderr: '',
                  exitCode: 0
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy,
                  warning: warningSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(warningSpy.calledOnce)
                chai_1.assert.equal(
                  warningSpy.args[0][0],
                  'No issues found for owner/repo v1.0.0. It may have already been closed...'
                )
                return [2 /*return*/]
            }
          })
        })
      })
      it('sets the issue-url output to null', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('owner')
                inputStub.withArgs('repo').returns('repo')
                execStub.returns({
                  stdout: '[]',
                  stderr: '',
                  exitCode: 0
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy,
                  warning: warningSpy,
                  setOutput: setOutputSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(setOutputSpy.calledOnce)
                chai_1.assert.equal(setOutputSpy.args[0][0], 'issue-url')
                chai_1.assert.equal(setOutputSpy.args[0][1], null)
                return [2 /*return*/]
            }
          })
        })
      })
    })
    describe('when more than one issue is found', function () {
      it('throws an error', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('owner')
                inputStub.withArgs('repo').returns('repo')
                execStub.returns({
                  stdout:
                    '[{"url":"url1","title":"title1"},{"url":"url2","title":"title2"}]',
                  stderr: '',
                  exitCode: 0
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy,
                  warning: warningSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(setFailedSpy.calledOnce)
                chai_1.assert.equal(
                  setFailedSpy.args[0][0],
                  'Found 2 issues for owner/repo v1.0.0. Please manually verify...'
                )
                return [2 /*return*/]
            }
          })
        })
      })
    })
    describe('when one issue is found', function () {
      it('sets the issue-url output', function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var core, github
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                inputStub
                  .withArgs('version', { required: true })
                  .returns('1.0.0')
                inputStub.withArgs('owner').returns('owner')
                inputStub.withArgs('repo').returns('repo')
                execStub.returns({
                  stdout: '[{"url":"url1","title":"title1"}]',
                  stderr: '',
                  exitCode: 0
                })
                core = {
                  getInput: inputStub,
                  info: infoSpy,
                  setFailed: setFailedSpy,
                  warning: warningSpy,
                  setOutput: setOutputSpy
                }
                github = {
                  context: {
                    repo: {
                      owner: 'owner',
                      repo: 'repo'
                    }
                  }
                }
                return [4 /*yield*/, (0, run_1.default)(core, github)]
              case 1:
                _a.sent()
                chai_1.assert.isTrue(setOutputSpy.calledOnce)
                chai_1.assert.equal(setOutputSpy.args[0][0], 'issue-url')
                chai_1.assert.equal(setOutputSpy.args[0][1], 'url1')
                return [2 /*return*/]
            }
          })
        })
      })
    })
  })
  describe('when an unexpected error occurs', function () {
    it('catches the error', function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var core, github
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              core = {
                getInput: function () {
                  throw new Error('BOOM!')
                },
                setFailed: setFailedSpy
              }
              github = {
                context: {
                  repo: {
                    owner: 'owner',
                    repo: 'repo'
                  }
                }
              }
              return [4 /*yield*/, (0, run_1.default)(core, github)]
            case 1:
              _a.sent()
              chai_1.assert.isTrue(setFailedSpy.calledOnce)
              chai_1.assert.equal(setFailedSpy.args[0][0], 'BOOM!')
              return [2 /*return*/]
          }
        })
      })
    })
  })
})
