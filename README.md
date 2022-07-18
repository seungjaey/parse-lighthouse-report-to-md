# parse-lighthouse-report-to-md
TBD: 

## Example
TBD:


## input
| 이름                    | 타입                 | 필수여부 | 설명                                                |
|-----------------------|--------------------|------|---------------------------------------------------|
| URL_LIST_JSON_STRING  | string (Multiline) | true | Lighthouse 테스트 URL 주소                             |
| REPORT_DIR_NAME       | string             | true | Lighthouse 테스트 결과 파일이 저장되어있는 경로                   |
| IMAGE_REPO_TOKEN      | string             | true | `final-screenshot` 이미지 저장을 위한 Github Token        |
| IMAGE_REPO_NAME       | string             | true | `final-screenshot` 이미지 저장을 위한 Github Repo 이름      |
| IMAGE_REPO_OWNER_NAME | string             | true | `final-screenshot` 이미지 저장을 위한 Github Repo 소유자 이름  |


## output
| 이름               | 타입     | 설명        |
|------------------|--------|-----------|
 | REPORT_MD_STRING | string | 마크다운 문자열  |
