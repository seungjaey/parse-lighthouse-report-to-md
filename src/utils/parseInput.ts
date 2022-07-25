import {getInput} from '@actions/core'
import {pipe, map, keys, fromEntries} from '@fxts/core'
import InputName from '../constants/InputName'

interface InputData {
  urlList: UrlList
  reportDirName: string
  s3BucketName: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

type InputDataEntries = [
  ['urlList', UrlList],
  ['reportDirName', string],
  ['s3BucketName', string],
  ['awsAccessKeyId', string],
  ['awsSecretAccessKey', string]
]

const InputDataMapping = {
  [InputName.URL_LIST_JSON_STRING]: 'urlList',
  [InputName.REPORT_DIR_NAME]: 'reportDirName',
  [InputName.S3_BUCKET_NAME]: 's3BucketName',
  [InputName.AWS_ACCESS_KEY_ID]: 'awsAccessKeyId',
  [InputName.AWS_SECRET_ACCESS_KEY]: 'awsSecretAccessKey'
}

export type UrlList = UrlItem[]

export interface UrlItem {
  label: string
  url: string
  path: string
  pathSlug: string
}

export default function parseInput(): InputData {
  const inputDataList = pipe(
    keys(InputDataMapping),
    map(inputName => {
      const isUrlData = inputName === InputName.URL_LIST_JSON_STRING
      const input = getInput(inputName)
      return [
        InputDataMapping[inputName],
        isUrlData ? JSON.parse(input) : input
      ]
    })
  )
  return fromEntries(inputDataList as unknown as InputDataEntries) as InputData
}
