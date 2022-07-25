import {error} from '@actions/core'
import {
  S3Client,
  PutObjectCommand,
  S3ServiceException
} from '@aws-sdk/client-s3'

const BufferRegex = new RegExp(/^data:image\/\w+;base64,/, 'g')

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
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: keyName,
          Body: Buffer.from(clearedImageStr, 'base64'),
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        })
      )
      return `https://${bucketName}.s3.ap-northeast-2.amazonaws.com/${keyName}`
    } catch (err) {
      error('Image upload failed')
      error((err as S3ServiceException).message)
      return ''
    }
  }
}

export default S3
