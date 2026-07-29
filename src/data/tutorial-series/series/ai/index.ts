import type { TutorialSeries } from '../../types'
import { pythonBasicsSeries } from './python-basics'
import { machineLearningSeries } from './machine-learning'
import { deepLearningSeries } from './deep-learning'
import { nlpSpeechSeries } from './nlp-speech'
import { llmSeries } from './llm'
import { aiEngineeringSeries } from './ai-engineering'

export const aiSeries: TutorialSeries[] = [
  ...pythonBasicsSeries,
  ...machineLearningSeries,
  ...deepLearningSeries,
  ...nlpSpeechSeries,
  ...llmSeries,
  ...aiEngineeringSeries,
]
