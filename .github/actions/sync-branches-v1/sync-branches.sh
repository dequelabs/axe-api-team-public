#!/usr/bin/env bash
set -euC -o pipefail
IFS=$'\n\t'

require_dependencies() {
  command -v gh >/dev/null 2>&1 || { echo "gh CLI is required" >&2; exit 1; }
  command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 1; }
}

require_inputs() {
  : "${GH_TOKEN:?GH_TOKEN is required}"
  : "${REPO:?REPO is required (owner/name)}"
  : "${HEAD_BRANCH:?HEAD_BRANCH is required}"
  : "${BASE_BRANCH:?BASE_BRANCH is required}"

  if [[ "${GH_TOKEN}" == "${WORKFLOW_TOKEN:-}" ]]; then
    echo "token must not be the workflow's GITHUB_TOKEN; PRs it opens do not trigger CI" >&2
    exit 1
  fi
}

normalize_optional_inputs() {
  if [[ "${PR_TITLE:-}" =~ ^[[:space:]]*$ ]]; then
    PR_TITLE=''
  fi
  if [[ "${PR_BODY:-}" =~ ^[[:space:]]*$ ]]; then
    PR_BODY=''
  fi
}

validate_branches() {
  local branch
  for branch in "${HEAD_BRANCH}" "${BASE_BRANCH}"; do
    if [[ "${branch}" == refs/* ]]; then
      echo "${branch} is a full ref; pass the short branch name" >&2
      exit 1
    fi
    if [[ "/${branch}/" == */into/* ]]; then
      echo "${branch} has an into path segment, which would make the sync branch name ambiguous" >&2
      exit 1
    fi
    if [[ ! "${branch}" =~ ^[A-Za-z0-9._/-]+$ ]] \
      || ! git check-ref-format --branch "${branch}" >/dev/null 2>&1; then
      echo "${branch} is not a valid branch name" >&2
      exit 1
    fi
  done

  if [[ "${HEAD_BRANCH}" == "${BASE_BRANCH}" ]]; then
    echo "HEAD_BRANCH and BASE_BRANCH must differ" >&2
    exit 1
  fi
}

default_body() {
  cat <<EOF
Brings \`${BASE_BRANCH}\` up to date with \`${HEAD_BRANCH}\`.

**Merge this PR with a merge commit. Do not squash or rebase.**
Squashing rewrites the commits, so \`${BASE_BRANCH}\` never shares history with \`${HEAD_BRANCH}\` and the next sync shows the same changes again, often with conflicts.

No QA Required
EOF
}

set_output() {
  echo "$1=$2" >>"${GITHUB_OUTPUT:-/dev/null}"
}

lookup_branch() {
  local branch=$1 err status=0
  { err=$(gh api "repos/${REPO}/git/ref/heads/${branch}" --jq .object.sha 2>&1 >&3); } 3>&1 || status=$?
  if (( status == 0 )); then
    return 0
  fi
  if [[ "${err}" == *"(HTTP 404)"* ]]; then
    return 1
  fi
  echo "Looking up ${branch} in ${REPO} failed: ${err}" >&2
  return 2
}

require_branch() {
  local branch=$1 sha status=0
  sha=$(lookup_branch "${branch}") || status=$?
  if (( status == 1 )); then
    echo "${branch} does not exist in ${REPO}" >&2
  fi
  (( status == 0 )) || exit 1
  printf '%s\n' "${sha}"
}

force_branch_to() {
  local branch=$1 sha=$2 status=0
  lookup_branch "${branch}" >/dev/null || status=$?
  case "${status}" in
    0) gh api --method PATCH "repos/${REPO}/git/refs/heads/${branch}" -f sha="${sha}" -F force=true >/dev/null ;;
    1) gh api --method POST "repos/${REPO}/git/refs" -f ref="refs/heads/${branch}" -f sha="${sha}" >/dev/null ;;
    *) exit 1 ;;
  esac
  echo "${branch} now points at ${sha}"
}

commits_ahead_of_base() {
  gh api "repos/${REPO}/compare/${BASE_BRANCH}...$1" --jq .ahead_by
}

find_open_pr() {
  gh pr list --repo "${REPO}" --head "$1" --base "${BASE_BRANCH}" --state open --json url,isCrossRepository \
    --jq '[.[] | select(.isCrossRepository | not)][0].url // empty'
}

open_pr() {
  gh pr create --repo "${REPO}" --head "$1" --base "${BASE_BRANCH}" \
    --title "${PR_TITLE:-chore: merge ${HEAD_BRANCH} into ${BASE_BRANCH}}" \
    --body "${PR_BODY:-$(default_body)}"
}

close_stale_pr() {
  local pr_url
  pr_url=$(find_open_pr "$1")
  if [[ -n "${pr_url}" ]]; then
    gh pr close "${pr_url}" --repo "${REPO}" \
      --comment "\`${BASE_BRANCH}\` already contains \`${HEAD_BRANCH}\`, so this sync PR has nothing left to merge." >/dev/null
    echo "Closed ${pr_url}; nothing left to merge"
  fi
}

ensure_pr() {
  local branch=$1 pr_url
  pr_url=$(find_open_pr "${branch}")
  if [[ -n "${pr_url}" ]]; then
    echo "Open PR already exists: ${pr_url}"
  else
    pr_url=$(open_pr "${branch}")
    echo "Opened ${pr_url}"
  fi
  set_output pr-url "${pr_url}"
}

main() {
  require_dependencies
  require_inputs
  normalize_optional_inputs
  validate_branches

  local sync_branch="chore/sync/${HEAD_BRANCH}/into/${BASE_BRANCH}" head_sha ahead_by
  head_sha=$(require_branch "${HEAD_BRANCH}")
  require_branch "${BASE_BRANCH}" >/dev/null

  force_branch_to "${sync_branch}" "${head_sha}"
  set_output branch "${sync_branch}"

  ahead_by=$(commits_ahead_of_base "${head_sha}")
  if [[ "${ahead_by}" == "0" ]]; then
    echo "${BASE_BRANCH} already contains ${HEAD_BRANCH}; nothing to merge."
    close_stale_pr "${sync_branch}"
    return 0
  fi

  ensure_pr "${sync_branch}"
}

main "$@"
