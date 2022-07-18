import {getInput} from '@actions/core'
import inputName from '../constants/InputName'

interface InputData {
  urlList: UrlList
  reportDirName: string
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
  const urlListString = getInput(inputName.URL_LIST_JSON_STRING)
  const reportDirName = getInput(inputName.REPORT_DIR_NAME)
  const ghToken = getInput(inputName.GH_TOKEN)
  const imageRepoName = getInput(inputName.IMAGE_REPO_NAME)
  const imageRepoOwnerName = getInput(inputName.IMAGE_REPO_OWNER_NAME)
  return {
    urlList: JSON.parse(urlListString),
    reportDirName,
    ghToken,
    imageRepoName,
    imageRepoOwnerName
  }
}
