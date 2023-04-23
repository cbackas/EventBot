import moment from 'moment'
import { type Moment, type Duration } from 'moment-timezone'

/**
 * Get a human readable string of the relative time between now and a future date
 * @param targetDate Date in the future
 * @returns A relative date string
 */
export function relativeTime (targetDate: Date): string {
  // get the difference between now and the target date
  const now: Moment = moment()
  const targetMoment: Moment = moment(targetDate)
  const duration: Duration = moment.duration(targetMoment.diff(now))

  // get the difference in days, weeks, months, and years
  const diffDays: number = duration.asDays()
  const diffWeeks: number = duration.asWeeks()
  const diffMonths: number = duration.asMonths()
  const diffYears: number = duration.asYears()

  // return the appropriate string for the difference
  if (diffYears >= 1) {
    return diffYears === 1 ? 'in 1 year' : `in ${Math.round(diffYears)} years`
  } else if (diffMonths >= 1) {
    return diffMonths === 1 ? 'in 1 month' : `in ${Math.round(diffMonths)} months`
  } else if (diffWeeks >= 1) {
    return diffWeeks === 1 ? 'next week' : `in ${Math.round(diffWeeks)} weeks`
  } else if (diffDays === 0) {
    return 'today'
  } else {
    return diffDays === 1 ? 'tomorrow' : `in ${Math.round(diffDays)} days`
  }
}

/**
 * Get a random 'vibrant' color from a predefined list
 * @returns A random vibrant color
 */
export function getRandomColor (): string {
  const vibrantColors = [
    '#FF5733',
    '#FFC300',
    '#4CAF50',
    '#FF9800',
    '#9C27B0',
    '#3F51B5',
    '#03A9F4',
    '#009688'
  ] as const

  const randomIndex: number = Math.floor(Math.random() * vibrantColors.length)
  return vibrantColors[randomIndex]
}
