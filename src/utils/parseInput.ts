import {getInput} from '@actions/core'
import inputName from '../constants/InputName'

interface InputData {
  urlList: UrlList
  reportDirName: string
  assertionDirName: string
  ghToken: string
  imageRepoName: string
  imageRepoOwnerName: string
}

export type UrlList = UrlItem[]

export interface UrlItem {
  label: string
  url: string
  path: string
  pathSlug: string
}

export default function parseInput(): InputData {
  // const urlListString = getInput(inputName.URL_LIST_JSON_STRING)
  // const reportDirName = getInput(inputName.REPORT_DIR_NAME)
  const assertionDirName = getInput(inputName.ASSERTION_DIR_NAME)
  const ghToken = getInput(inputName.GH_TOKEN)
  const imageRepoName = getInput(inputName.IMAGE_REPO_NAME)
  const imageRepoOwnerName = getInput(inputName.IMAGE_REPO_OWNER_NAME)
  return {
    // urlList: JSON.parse(urlListString),
    urlList: [
      {label: '홈', path: '/', pathSlug: '_', url: 'http://localhost:3000/'},
      {
        label: '포스트',
        path: '/posts',
        pathSlug: '_posts',
        url: 'http://localhost:3000/posts'
      }
    ],
    assertionDirName,
    reportDirName:
      '/Users/mk-mac-135/Projects/lab/consumer-app/.lighthouse-report',
    ghToken: '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',
    imageRepoName: 'image-dummy',
    imageRepoOwnerName: 'seungjaey'
  }
}
