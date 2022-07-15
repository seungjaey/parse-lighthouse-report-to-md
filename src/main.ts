import {writeFile, readFile} from 'fs/promises'
import {
  pipe,
  map,
  toArray,
  toAsync,
  entries,
  groupBy,
  range,
  keys,
  flat
} from '@fxts/core'
import {context, getOctokit} from '@actions/github'
import * as core from '@actions/core'

import parseInput, {UrlItem, UrlList} from './utils/parseInput'
import {FormFactorList} from './constants/FormFactor'

interface SimpleRunnerResult {
  audits: {
    'final-screenshot': {
      details: {
        data: string
      }
    }
  }
}

interface ManifestItem {
  url: string
  isRepresentativeRun: boolean
  htmlPath: string
  jsonPath: string
  summary: {
    performance: number
    accessibility: number
    'best-practices': number
    seo: number
    pwa: number
  }

  id?: string
  imageBinary?: string
  imagePath?: string
  formFactor?: string
}

interface MnimumManifestItem {
  url: string
  jsonPath: string
  summary: {
    performance: number
    accessibility: number
    'best-practices': number
    seo: number
    pwa: number
  }

  formFactor?: string
}

const getEntryEpochTime = () => Date.now()

const uploadImage = async (
  epochTime: number,
  ghToken: string,
  repoName: string,
  ownerName: string,
  formFactor: string,
  pathSlug: string,
  imageBinaryStr: string
): Promise<string> => {
  try {
    const ocktokit = getOctokit(ghToken)
    const JPEG_PLACE_HOLDER = 'data:image/jpeg;base64,'
    const result = await ocktokit.rest.repos.createOrUpdateFileContents({
      owner: ownerName,
      repo: repoName,
      message: 'Adding an image to the repository',
      path: `${epochTime}/${formFactor}/${encodeURIComponent(pathSlug)}.jpg`,
      content: imageBinaryStr.replace(JPEG_PLACE_HOLDER, '')
    })
    return result.data?.content?.download_url || ''
  } catch (error) {
    return ''
  }
}

async function run(): Promise<void> {
  try {
    const input = parseInput()
    const {urlList, reportDirName, ghToken, imageRepoName, imageRepoOwnerName} =
      input
    const entryEpochTime = getEntryEpochTime()
    const urlGrouped = pipe(
      urlList,
      groupBy(urlItem => urlItem.url),
    ) as { [url: string]: UrlList }

    const data = await pipe(
      FormFactorList,
      toAsync,
      map(async formFactor => {
        const filePath = `${reportDirName}/${formFactor}/manifest.json`
        const fileContent = await readFile(filePath)
        const manifestList = JSON.parse(
          fileContent.toString()
        ) as unknown as ManifestItem[]
        return [formFactor, manifestList]
      }),
      map(async args => {
        const [formFactor, manifestList] = args
        return pipe(
          manifestList as ManifestItem[],
          map(manifestItem => ({...manifestItem, formFactor})),
          toAsync,
          map(async manifestItem => {
            const {jsonPath} = manifestItem
            const fileContent = await readFile(jsonPath)
            const runnerResult = JSON.parse(
              fileContent.toString()
            ) as unknown as SimpleRunnerResult
            return {
              ...manifestItem,
              imageBinary: runnerResult.audits['final-screenshot'].details.data
            }
          }),
          map(async manifestItem => {
            const {imageBinary, url} = manifestItem
            const {pathSlug, label, path} = urlGrouped[url][0]
            const imagePath = await uploadImage(
              entryEpochTime,
              ghToken,
              imageRepoName,
              imageRepoOwnerName,
              manifestItem.formFactor as string,
              pathSlug,
              imageBinary
            )
            return {
              ...manifestItem,
              id: `${label} (${path})`,
              imagePath
            }
          }),
          toArray
        )
      }),
      flat,
      groupBy(a => a.id),
      entries,
      map(args => {
        const [id, list] = args
        return `
              <details>
                <summary>${id}</summary>
                <table>
                <tbody>
                ${pipe(
                  list,
                  map(a => {
                    const {formFactor, summary, imagePath} = a
                    return `
                          <tr>
                            <td>${formFactor}</td> 
                            <td><img src="${imagePath}" width="250" height="250"></td>
                            <td>
                              <dl>
                                <dt>Summary</dt>
                                ${pipe(
                      range(0, scoreKeyNames.length),
                      map(si => {
                        const score = scoreList[si]
                        return `<dd>${scoreToColor(score)} ${
                          scoreKeyNames[si]
                        } ${score}</dd>`
                      }),
                      toArray
                    ).join('\n')}
                              </dl>
                            </td>
                          </tr>
                `
          }),
          toArray
        ).join('\n')}
                </tbody>
                </table>
                </details>
            `
      })
      toArray
    )
    console.log(data)
    core.setOutput('REPORT_MD_STRING', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
