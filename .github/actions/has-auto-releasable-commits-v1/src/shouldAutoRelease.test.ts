import 'mocha'
import { assert } from 'chai'
import shouldAutoRelease from './shouldAutoRelease'

describe('shouldAutoRelease', () => {
  describe('when there are no commits', () => {
    describe('and version is not locked', () => {
      it('should return false', () => {
        const result = shouldAutoRelease({
          commitList: [],
          isVersionLocked: false
        })
        assert.isFalse(result)
      })
    })

    describe('and version is locked', () => {
      it('should return false', () => {
        const result = shouldAutoRelease({
          commitList: [],
          isVersionLocked: true
        })
        assert.isFalse(result)
      })
    })
  })

  describe('when there are commits', () => {
    describe('and version is not locked', () => {
      describe('and there are no feat or fix commits', () => {
        it('should return false', () => {
          const result = shouldAutoRelease({
            commitList: [
              {
                commit: '061acd5 refactor(scope): some refactor (#664)',
                title: 'refactor(scope): some refactor (#664)',
                sha: '061acd5',
                type: 'refactor',
                id: '664',
                link: 'something'
              }
            ],
            isVersionLocked: false
          })
          assert.isFalse(result)
        })
      })

      describe('and there are feat or fix commits', () => {
        it('should return true', () => {
          const result = shouldAutoRelease({
            commitList: [
              {
                commit: '061acd5 refactor(scope): some refactor (#664)',
                title: 'refactor(scope): some refactor (#664)',
                sha: '061acd5',
                type: 'refactor',
                id: '664',
                link: 'something'
              },
              {
                commit: '061acd5 feat(scope): some feature (#664)',
                title: 'feat(scope): some feature (#664)',
                sha: '061acd5',
                type: 'feat',
                id: '664',
                link: 'something'
              }
            ],
            isVersionLocked: false
          })
          assert.isTrue(result)
        })
      })
    })

    describe('and version is locked', () => {
      describe('and there are no breaking changes', () => {
        describe('and there are no major or minor changes for axe-core', () => {
          describe('and there are feat or fix commits', () => {
            it('should return true', () => {
              const result = shouldAutoRelease({
                commitList: [
                  {
                    commit: '061acd5 refactor(scope): some refactor (#664)',
                    title: 'refactor(scope): some refactor (#664)',
                    sha: '061acd5',
                    type: 'refactor',
                    id: '664',
                    link: 'something'
                  },
                  {
                    commit: '061acd5 feat(scope): some feature (#664)',
                    title: 'feat(scope): some feature (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  }
                ],
                isVersionLocked: true
              })

              assert.isTrue(result)
            })
          })
        })

        describe('and there are major or minor changes for axe-core', () => {
          describe('and there are feat or fix commits', () => {
            it('should return false', () => {
              const result = shouldAutoRelease({
                commitList: [
                  {
                    commit: '061acd5 refactor(scope): some refactor (#664)',
                    title: 'refactor(scope): some refactor (#664)',
                    sha: '061acd5',
                    type: 'refactor',
                    id: '664',
                    link: 'something'
                  },
                  {
                    commit: '061acd5 feat(scope): some feature (#664)',
                    title: 'feat(scope): some feature (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  },
                  {
                    commit:
                      '061acd5 feat(scope): update axe-core to 4.0.0 (#664)',
                    title: 'feat(scope): update axe-core to 4.0.0 (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  }
                ],
                isVersionLocked: true
              })

              assert.isFalse(result)
            })
          })

          describe('and there are no feat or fix commits', () => {
            it('should return false', () => {
              const result = shouldAutoRelease({
                commitList: [
                  {
                    commit:
                      '061acd5 feat(scope): update axe-core to 4.0.0 (#664)',
                    title: 'feat(scope): update axe-core to 4.0.0 (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  }
                ],
                isVersionLocked: true
              })

              assert.isFalse(result)
            })
          })
        })
      })

      describe('and there are breaking changes', () => {
        it('should return false', () => {
          const result = shouldAutoRelease({
            commitList: [
              {
                commit: '061acd5 feat(scope)!: some feature (#664)',
                title: 'feat(scope): some feature (#664)',
                sha: '061acd5',
                type: 'feat!',
                id: '664',
                link: 'something'
              },
              {
                commit: '061acd5 feat(scope): some feature (#664)',
                title: 'feat(scope): some feature (#664)',
                sha: '061acd5',
                type: 'feat',
                id: '664',
                link: 'something'
              }
            ],
            isVersionLocked: true
          })

          assert.isFalse(result)
        })
      })

      describe('and there are breaking changes for axe-core', () => {
        it('should return false', () => {
          const result = shouldAutoRelease({
            commitList: [
              {
                commit: '061acd5 feat(scope): some feature (#664)',
                title: 'feat(scope): some feature (#664)',
                sha: '061acd5',
                type: 'feat',
                id: '664',
                link: 'something'
              },
              {
                commit: '061acd5 feat(scope)!: update axe-core to 4.0.0 (#664)',
                title: 'feat(scope)!: update axe-core to 4.0.0 (#664)',
                sha: '061acd5',
                type: 'feat!',
                id: '664',
                link: 'something'
              }
            ],
            isVersionLocked: true
          })

          assert.isFalse(result)
        })
      })
    })
  })
})
