import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('The username of the user you want to report')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the report')
            .setRequired(true));

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const reportedUsername = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');
    const reporterDiscordTag = interaction.user.tag;


    await interaction.editReply(`Report against ${reportedUsername} has been received. Reason: ${reason}`);
}
