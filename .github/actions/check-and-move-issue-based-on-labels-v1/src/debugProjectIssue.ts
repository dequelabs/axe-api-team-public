import { getOctokit } from '@actions/github'

interface DebugProjectConnectionArgs {
  issueOwner: string
  issueRepo: string
  issueNumber: number
  octokit: ReturnType<typeof getOctokit>
}

// eslint-disable-next-line
// @ts-ignore
export default async function debugProjectConnection({
  issueOwner,
  issueRepo,
  issueNumber,
  octokit
}: DebugProjectConnectionArgs) {
  console.log(`\n🔍 Debugging project connection for ${issueOwner}/${issueRepo}#${issueNumber}\n`)

  const issueQuery = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
          title
          projectV2Items(first: 20) {
            nodes {
              id
              project {
                id
                number
                title
              }
            }
          }
        }
      }
    }
  `
// eslint-disable-next-line
  const issueResult = await octokit.graphql<any>(issueQuery, {
    owner: issueOwner,
    repo: issueRepo,
    number: issueNumber
  })

  const issueId = issueResult.repository.issue.id
  console.log(`✅ Issue ID: ${issueId}`)
  console.log(`📋 Issue Title: ${issueResult.repository.issue.title}`)
  console.log(`📊 ProjectV2Items count: ${issueResult.repository.issue.projectV2Items.nodes.length}`)

  if (issueResult.repository.issue.projectV2Items.nodes.length > 0) {
    console.log('\n✅ Found projects via projectV2Items:')
    // eslint-disable-next-line
    issueResult.repository.issue.projectV2Items.nodes.forEach((item: any) => {
      console.log(`  - Project #${item.project.number}: ${item.project.title}`)
    })
    return
  }

  console.log('\n⚠️ No projects found via projectV2Items. Trying alternative methods...\n')

  console.log('🔍 Searching organization projects...')
  try {
    const orgProjectsQuery = `
      query($org: String!) {
        organization(login: $org) {
          projectsV2(first: 20) {
            nodes {
              id
              number
              title
              closed
            }
          }
        }
      }
    `
    // eslint-disable-next-line
    const orgProjects = await octokit.graphql<any>(orgProjectsQuery, {
      org: issueOwner
    })

    if (orgProjects.organization?.projectsV2?.nodes) {
      console.log(`\n📁 Found ${orgProjects.organization.projectsV2.nodes.length} organization projects:`)

      for (const project of orgProjects.organization.projectsV2.nodes) {
        if (project.closed) {
          console.log(`  ⏸️  Project #${project.number}: ${project.title} (CLOSED)`)
          continue
        }

        console.log(`  🔍 Checking Project #${project.number}: ${project.title}...`)

        const projectItemsQuery = `
          query($projectId: ID!, $issueId: ID!) {
            node(id: $projectId) {
              ... on ProjectV2 {
                items(first: 100) {
                  nodes {
                    id
                    content {
                      ... on Issue {
                        id
                        number
                        repository {
                          name
                          owner {
                            login
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `
        // eslint-disable-next-line
        const projectItems = await octokit.graphql<any>(projectItemsQuery, {
          projectId: project.id,
          issueId: issueId
        })
        // eslint-disable-next-line
        const foundItem = projectItems.node?.items?.nodes?.find((item: any) =>
          item.content?.id === issueId
        )

        if (foundItem) {
          console.log(`    ✅ FOUND! Issue is in this project with item ID: ${foundItem.id}`)
          console.log(`\n🎯 Issue found in Project #${project.number}: "${project.title}"`)
          console.log(`   Project ID: ${project.id}`)
          console.log(`   Item ID: ${foundItem.id}`)
          return {
            projectId: project.id,
            projectNumber: project.number,
            projectTitle: project.title,
            itemId: foundItem.id
          }
        } else {
          console.log(`    ❌ Not in this project`)
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log(`❌ ${issueOwner} is not an organization or error accessing org projects`)
  }

  console.log('\n🔍 Searching user projects...')
  try {
    const userProjectsQuery = `
      query($user: String!) {
        user(login: $user) {
          projectsV2(first: 20) {
            nodes {
              id
              number
              title
              closed
            }
          }
        }
      }
    `
    // eslint-disable-next-line
    const userProjects = await octokit.graphql<any>(userProjectsQuery, {
      user: issueOwner
    })

    if (userProjects.user?.projectsV2?.nodes) {
      console.log(`\n📁 Found ${userProjects.user.projectsV2.nodes.length} user projects:`)

      for (const project of userProjects.user.projectsV2.nodes) {
        if (project.closed) {
          console.log(`  ⏸️  Project #${project.number}: ${project.title} (CLOSED)`)
          continue
        }

        console.log(`  🔍 Checking Project #${project.number}: ${project.title}...`)

        const projectItemsQuery = `
          query($projectId: ID!) {
            node(id: $projectId) {
              ... on ProjectV2 {
                items(first: 100) {
                  nodes {
                    id
                    content {
                      ... on Issue {
                        id
                        number
                        repository {
                          name
                          owner {
                            login
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `

        // eslint-disable-next-line
        const projectItems = await octokit.graphql<any>(projectItemsQuery, {
          projectId: project.id
        })

        // eslint-disable-next-line
        const foundItem = projectItems.node?.items?.nodes?.find((item: any) =>
          item.content?.id === issueId
        )

        if (foundItem) {
          console.log(`    ✅ FOUND! Issue is in this project with item ID: ${foundItem.id}`)
          console.log(`\n🎯 Issue found in Project #${project.number}: "${project.title}"`)
          console.log(`   Project ID: ${project.id}`)
          console.log(`   Item ID: ${foundItem.id}`)
          return {
            projectId: project.id,
            projectNumber: project.number,
            projectTitle: project.title,
            itemId: foundItem.id
          }
        } else {
          console.log(`    ❌ Not in this project`)
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log(`❌ ${issueOwner} is not a user or error accessing user projects`)
  }

  console.log('\n🔍 Checking repository projects (legacy)...')
  try {
    const repoProjectsQuery = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          projectsV2(first: 20) {
            nodes {
              id
              number
              title
              closed
            }
          }
        }
      }
    `

    // eslint-disable-next-line
    const repoProjects = await octokit.graphql<any>(repoProjectsQuery, {
      owner: issueOwner,
      repo: issueRepo
    })

    if (repoProjects.repository?.projectsV2?.nodes?.length > 0) {
      console.log(`\n📁 Found ${repoProjects.repository.projectsV2.nodes.length} repository projects`)
    } else {
      console.log('❌ No repository-level projects found')
    }
  } catch (error) {
    console.log('❌ Error checking repository projects:', error)
  }

  console.log('\n❌ Issue not found in any accessible projects')
  console.log('\n💡 Possible reasons:')
  console.log('  1. The project might be private and requires additional permissions')
  console.log('  2. The issue might be added as a draft item (not fully linked)')
  console.log('  3. There might be a sync delay between the issue and project')
  console.log('  4. The project might be at a different scope (org/user/repo) than expected')
}
