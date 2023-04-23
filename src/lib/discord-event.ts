import { ChannelType, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, type GuildScheduledEvent, type Guild } from 'discord.js'
import moment from 'moment-timezone'
import * as textToImage from 'text-to-image'
import { getRandomColor, relativeTime } from '../lib/utils'
import { discordClient } from '../app'

export class DiscordEvent {
  public readonly startTime: Date
  public readonly endTime: Date

  private guild?: Guild

  private constructor (
    public readonly summary: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly guildId: string,
    public readonly channelId: string,
    public readonly description: string
  ) {
    this.startTime = moment(this.startDate).utc().toDate()
    this.endTime = moment(this.endDate).utc().toDate()
  }

  /**
   * Static method that creates a discord event and attaches the guild to the event
   * @param event the data needed to create a new DiscordEvent
   * @returns DiscordEvent with the guild attached
   */
  public static async new (event: {
    summary: string
    startDate: Date
    endDate: Date
    guildId: string
    channelId: string
    description: string

  }): Promise<DiscordEvent> {
    const newEvent = new DiscordEvent(event.summary, event.startDate, event.endDate, event.guildId, event.channelId, event.description)

    // fetch the guild and store it on the event
    newEvent.guild = await discordClient.guilds.fetch(event.guildId)
    if (newEvent.guild == null) {
      throw new Error(`Guild ${event.guildId} not found`)
    }

    return newEvent
  }

  /**
   * Creates a cover image for the Discord Event with the time to the event in human readable format
   * @returns the base64 encoded image as a string
   */
  private async generateCoverImage (): Promise<string> {
    return await textToImage.generate(relativeTime(this.startDate), {
      maxWidth: 880,
      customHeight: 352,
      textAlign: 'center',
      verticalAlign: 'center',
      fontSize: 100,
      fontFamily: 'Arial',
      bgColor: getRandomColor(),
      textColor: 'white'
    })
  }

  /**
   * Creates this DiscordEvent as a scheduled event in the guild
   */
  public async createEvent (): Promise<void> {
    const image: string = await this.generateCoverImage()

    const existingEvent = await this.findExistingEvent()
    if (existingEvent != null) {
      await this.editExistingEvent(existingEvent)
      return
    }

    const channel = await discordClient.channels.fetch(this.channelId)
    if (channel == null || channel.type !== ChannelType.GuildVoice) {
      console.error(`Channel ${this.channelId} is not a voice channel, skipping`)
      return
    }

    if (this.guild == null) throw new Error('Guild is null')

    const scheduledEvent = await this.guild.scheduledEvents.create({
      name: this.summary,
      description: this.description,
      scheduledStartTime: this.startTime,
      scheduledEndTime: this.endTime,
      channel,
      image,
      entityType: GuildScheduledEventEntityType.Voice,
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly
    })

    console.log(JSON.stringify(scheduledEvent, null, 2))
  }

  /**
   * Edit an existing event and update it with the new information if it has changed
   * @param existingEvent the existing event to edit
   */
  private async editExistingEvent (existingEvent: GuildScheduledEvent): Promise<void> {
    const image: string = await this.generateCoverImage()

    // check if the other things are different
    const descriptionMatches = existingEvent.description === this.description
    const locationMatches = existingEvent.guildId === this.guildId && existingEvent.channel?.id === this.channelId
    const timeMatches = existingEvent.scheduledStartAt?.getTime() === this.startDate.getTime() && existingEvent.scheduledEndAt?.getTime() === this.endDate.getTime()
    if (descriptionMatches && locationMatches && timeMatches) {
      console.log(`Event ${this.summary} already exists, skipping`)
      // for now it doesn't actually skip, but it should
      await existingEvent.edit({
        description: this.description,
        scheduledStartTime: this.startTime,
        scheduledEndTime: this.endTime,
        image
      })
      return
    }

    console.log(`Event ${this.summary} already exists but required an update`)
    await existingEvent.edit({
      description: this.description,
      scheduledStartTime: this.startTime,
      scheduledEndTime: this.endTime,
      image
    })
  }

  /**
   * Find an existing event in the guild with the same name and date
   * @returns The existing event if it exists
   */
  private async findExistingEvent (): Promise<GuildScheduledEvent | undefined> {
    if (this.guild == null) throw new Error('Guild is null')
    return (await this.guild.scheduledEvents.fetch()).find(scheduledEvent => {
      const nameMatehes: boolean = scheduledEvent.name === this.summary
      const dateMatches: boolean = scheduledEvent.scheduledStartAt?.getDate() === this.startDate.getDate()
      return nameMatehes && dateMatches
    })
  }
}
