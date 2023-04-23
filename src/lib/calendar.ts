import { type CalendarResponse, parseICS, type CalendarComponent } from 'node-ical'
import moment, { type Moment } from 'moment-timezone'
import { DiscordEvent } from './discord-event'

/**
 * Gets the upcoming events from the provided iCal URL
 * @param iCalURL string URL to the iCal file
 * @param days optional number of days to fetch events for
 * @returns An array of DiscordEvents
 */
export async function getUpcomingEvents (iCalURL: string, days: number = 7): Promise < DiscordEvent[] > {
  // fetch the calendar events
  const calEventResponse = await fetch(iCalURL)
  if (calEventResponse.status !== 200) {
    throw new Error(`Failed to fetch calendar events: ${calEventResponse.statusText}`)
  }

  // parse the calendar events into a node-ical response
  const calEvents: CalendarResponse = parseICS(await calEventResponse.text())
  // parse the node-ical response into custom DiscordEvent objects
  const parsed: DiscordEvent[] = await parseDiscordEvents(calEvents)

  // filter the events to only include events that are within the next 7 days
  const from: Moment = moment()
  const til: Moment = moment().add(days, 'days')
  const filtered = parsed.filter(event => {
    const eventStartDate = moment(event.startDate)
    return eventStartDate.isBetween(from, til)
  })

  return filtered
}

/**
 * Parses the events from the calendar response
 * @param calendarResponse The calendar response from node-ical
 * @returns An array of DiscordEvents
 */
export async function parseDiscordEvents (calendarResponse: CalendarResponse): Promise<DiscordEvent[]> {
  const events: DiscordEvent[] = []

  // loop through all events in the calendar
  for (const eventKey in calendarResponse) {
    // skip if the event is not a VEVENT
    const event: CalendarComponent = calendarResponse[eventKey]
    if (event.type !== 'VEVENT') continue

    // pull values out of the event
    const {
      rrule,
      start: eventStartDate,
      end: eventEndDate,
      summary,
      location = '',
      description = ''
    } = event
    const [guildId, channelId] = location.split(':')

    // if there is no rrule, just create a single event
    if (rrule == null) {
      events.push(await DiscordEvent.new({
        summary,
        startDate: eventStartDate,
        endDate: eventEndDate,
        guildId,
        channelId,
        description
      }))
      continue
    }

    // if there is an rrule, create multiple events

    const now = moment()
    const until = now.clone().add(1, 'months') // Get all events for the next year

    const dates = rrule.between(now.toDate(), until.toDate())
    for (const date of dates) {
      const start = new Date(date.setHours(date.getHours() - ((event.start.getTimezoneOffset() - date.getTimezoneOffset()) / 60)))
      const duration = eventEndDate.getTime() - eventStartDate.getTime()
      const end = new Date(start.getTime() + duration)

      events.push(await DiscordEvent.new({
        summary,
        startDate: start,
        endDate: end,
        guildId,
        channelId,
        description
      }))
    }
  }

  return events
}
