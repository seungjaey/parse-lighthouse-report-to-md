import {error} from '@actions/core'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  S3ServiceException
} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'

const BufferRegex = new RegExp(/^data:image\/\w+;base64,/, 'g')

const WEEK_SECOND = 604800

class S3 {
  client: S3Client | null

  constructor(accessKeyId: string, secretAccessKey: string) {
    this.client = new S3Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  }

  async uploadImage(
    bucketName: string,
    keyName: string,
    imageStr: string
  ): Promise<string> {
    if (!this.client) {
      error('S3 Client is empty')
      return ''
    }
    try {
      const clearedImageStr = imageStr.replace(BufferRegex, '')
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: keyName,
        Body: Buffer.from(clearedImageStr, 'base64'),
        ContentType: 'image/jpeg',
        ACL: 'authenticated-read'
      })
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: keyName
      })
      await this.client.send(putObjectCommand)
      const signedUrl = await getSignedUrl(this.client, getObjectCommand, {
        expiresIn: WEEK_SECOND
      })
      return signedUrl
    } catch (err) {
      error('Image upload failed')
      error((err as S3ServiceException).message)
      return ''
    }
  }
}

export default S3
