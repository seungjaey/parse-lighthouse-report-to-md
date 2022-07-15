export type FormFactorName = 'desktop' | 'mobile'

const FormFactor: Record<FormFactorName, FormFactorName> = {
  desktop: 'desktop',
  mobile: 'mobile'
}

export const FormFactorList: FormFactorName[] = ['mobile', 'desktop']

export default FormFactor
