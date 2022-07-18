import {writeFile, readFile} from 'fs/promises'
import {
  pipe,
  map,
  toArray,
  toAsync,
  entries,
  groupBy,
  keys,
  flat,
  values,
  some,
  reject
} from '@fxts/core'
import {getOctokit} from '@actions/github'
import * as core from '@actions/core'

import parseInput, {UrlList} from './utils/parseInput'
import {FormFactorList, FormFactorName} from './constants/FormFactor'

interface SimpleRunnerResult {
  audits: {
    'final-screenshot': {
      details: {
        data: string
      }
    }
  }
}

interface ManifestSummary {
  performance: number
  accessibility: number
  'best-practices': number
  seo: number
  pwa: number
}

interface ManifestItem {
  url: string
  isRepresentativeRun: boolean
  htmlPath: string
  jsonPath: string
  summary: ManifestSummary

  id?: string
  imageBinary?: string
  imagePath?: string
  formFactor?: string
}

const getEntryEpochTime = (): number => Date.now()

const uploadImage = async (
  epochTime: number,
  imageRepoToken: string,
  repoName: string,
  ownerName: string,
  formFactor: string,
  pathSlug: string,
  imageBinaryStr: string
): Promise<string> => {
  try {
    const ocktokit = getOctokit(imageRepoToken)
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
    core.error('image upload error')
    core.error((error as Error).message)
    core.error((error as Error).stack || '')
    return ''
  }
}

const scoreToColor = (score: number): string =>
  score >= 90 ? '🟢' : score >= 50 ? '🟠' : '🔴'

const createMarkdownTableRow = (
  formFactor: FormFactorName,
  summary: ManifestSummary,
  imagePath: string
): string => {
  const scoreKeyNames = keys(summary)
  return [
    '\t<tr>',
    `\t\t<td>${formFactor}</td>`,
    `\t\t<td><img src="${imagePath}" width="250" height="250"></td>`,
    '\t\t<td>',
    '\t\t\t<dl>',
    '\t\t\t\t<dt>Summary</dt>',
    ...pipe(
      scoreKeyNames,
      map(scoreKeyName => {
        const score = summary[scoreKeyName] * 100
        return `\t\t\t\t<dd>${scoreToColor(
          score
        )} ${scoreKeyName} ${score}</dd>`
      }),
      toArray
    ),
    '\t\t\t</dl>',
    '\t\t</td>',
    '\t</tr>'
  ].join('\n')
}

async function run(): Promise<void> {
  try {
    const input = parseInput()
    const {
      urlList,
      reportDirName,
      imageRepoToken,
      imageRepoName,
      imageRepoOwnerName
    } = input
    const entryEpochTime = getEntryEpochTime()
    const urlGrouped = pipe(
      urlList,
      groupBy(urlItem => urlItem.url)
    ) as {[url: string]: UrlList}

    const lighthouseReportMarkdownStr = await pipe(
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
          map(manifestItem => ({
            ...manifestItem,
            formFactor
          })),
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
              imageRepoToken,
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
        const hasLowScore = pipe(
          list,
          map(({summary}) =>
            pipe(
              keys(summary),
              reject(keyName => keyName === 'pwa'),
              map(keyName => summary[keyName]),
              toArray
            )
          ),
          flat,
          toArray,
          some(score => score < 0.5)
        )
        return [
          `<details ${hasLowScore ? 'open' : ''}>`,
          `\t<summary>${hasLowScore ? '🚨' : ''} ${id}</summary>`,
          '\t<table>',
          '\t<tbody>',
          ...pipe(
            list,
            map(a => {
              const {formFactor, summary, imagePath} = a
              return createMarkdownTableRow(
                formFactor as FormFactorName,
                summary,
                imagePath
              )
            }),
            toArray
          ),
          '\t</tbody>',
          '\t</table>',
          '</details>'
        ].join('\n')
      }),
      toArray
    )
    const result = [
      `### ⚡️ Lighthouse-CI\n`,
      lighthouseReportMarkdownStr.join('\n')
    ].join('\n')

    await writeFile(`${reportDirName}/summary.md`, result)

    core.setOutput('REPORT_MD_STRING', result)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
