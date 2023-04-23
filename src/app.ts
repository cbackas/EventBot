import * as dotenv from 'dotenv'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { CommandManager } from './managers/command-manager'
import { type DiscordEvent } from './lib/discord-event'
import { getUpcomingEvents } from './lib/calendar'

dotenv.config()

if (process.env.DISCORD_TOKEN == null) throw new Error('DISCORD_TOKEN is not defined')
if (process.env.DISCORD_CLIENT_ID == null) throw new Error('DISCORD_CLIENT_ID is not defined')
if (process.env.DISCORD_GUILD_ID == null) throw new Error('DISCORD_GUILD_ID is not defined')
if (process.env.TZ == null) throw new Error('TZ is not defined')
if (process.env.ICAL_URL == null) throw new Error('ICAL_URL is not defined')

const token: string = process.env.DISCORD_TOKEN
const clientId: string = process.env.DISCORD_CLIENT_ID
const guildId: string = process.env.DISCORD_GUILD_ID
const calURL: string = process.env.ICAL_URL

const commandManager = new CommandManager(token, clientId, guildId)
await commandManager.registerCommands()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on(Events.ClientReady, async () => {
  const { user } = client
  if (user == null) throw new Error('User is null')
  console.log(`Logged in as ${user.tag}!`)
})

client.on(Events.InteractionCreate, commandManager.interactionHandler)

void client.login(token)

export const discordClient = client

const upcoming: DiscordEvent[] = await getUpcomingEvents(calURL, 22)
await Promise.all(upcoming.map(async event => { await event.createEvent() }))
