# parse-lighthouse-report-to-md
TBD: 

## Example
TBD:


## input
| 이름                    | 타입                 | 필수여부 | 설명                                                     |
|-----------------------|--------------------|------|--------------------------------------------------------|
| URL_LIST_JSON_STRING  | string (Multiline) | true | Lighthouse 테스트 URL 주소                                  |
| REPORT_DIR_NAME       | string             | true | Lighthouse 테스트 결과 파일이 저장되어있는 경로                        |
| AWS_ACCESS_KEY_ID                   | string             | true | `final-screenshot` 이미지 s3 저장을 위한 AWS ACCESS_KEY_ID     |
| AWS_SECRET_ACCESS_KEY       | string             | true | `final-screenshot` 이미지 s3 저장을 위한 AWS_SECRET_ACCESS_KEY |


## output
| 이름               | 타입     | 설명        |
|------------------|--------|-----------|
 | REPORT_MD_STRING | string | 마크다운 문자열  |
