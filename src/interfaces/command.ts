import { type AnySelectMenuInteraction, type AutocompleteInteraction, type ChatInputCommandInteraction, type InteractionResponse, type Message, type SlashCommandBuilder, type SlashCommandSubcommandBuilder, type SlashCommandSubcommandGroupBuilder, type SlashCommandSubcommandsOnlyBuilder } from 'discord.js'

type ExecuteFunction = void | Message<boolean> | InteractionResponse<boolean>

export interface CommandV2 {
  slashCommand: {
    main: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder
    subCommands?: SlashCommandSubcommandBuilder[]
    subGroups?: Array<{
      main: SlashCommandSubcommandGroupBuilder
      subCommands: SlashCommandSubcommandBuilder[]
    }>
  }
  selectMenuIds?: string[]
  executeCommand: (interaction: ChatInputCommandInteraction) => Promise<ExecuteFunction>
  executeAutoComplate?: (interaction: AutocompleteInteraction) => Promise<ExecuteFunction>
  executeSelectMenu?: (interaction: AnySelectMenuInteraction) => Promise<ExecuteFunction>
}
