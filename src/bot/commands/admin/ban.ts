
import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import functions from "../../../utilities/structs/functions.js";


export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a users account')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user whose account you want to ban')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('The reason for banning the account')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {

    await interaction.deferReply({ ephemeral: true });

    let msg: string = "";
    const reason: string = interaction.options.getString('reason')!;

    const targetUser = await Users.findOne({ username_lower: interaction.options.getUser('user')?.username.toLowerCase() });
    if (!targetUser) msg = "The account username you entered does not exist.";
    else if (targetUser.banned == true) msg = "This account is already banned.";

    if (targetUser && targetUser.banned !== true) {
        await targetUser.updateOne({ $set: { banned: true } });

        let refreshToken = global.refreshTokens.findIndex(i => i.accountId == targetUser.accountId);
        if (refreshToken != -1) global.refreshTokens.splice(refreshToken, 1);

        let accessToken = global.accessTokens.findIndex(i => i.accountId == targetUser.accountId);
        if (accessToken != -1) {
            global.accessTokens.splice(accessToken, 1);

            let xmppClient = global.Clients.find(client => client.accountId == targetUser.accountId);
            if (xmppClient) xmppClient.client.close();
        }

        if (accessToken != -1 || refreshToken != -1) await functions.UpdateTokens(); 
    }

    const embed = new EmbedBuilder()
        .setTitle("Account banned")
        .setDescription("User with name " + interaction.options.getUser('user')?.username + " has been banned")
        .addFields(
            {
                name: "Reason",
                value: reason,
            },
        )
        .setColor("#2b2d31")
        .setFooter({
            text: "Star",
            iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
        })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    await interaction.options.getUser('user')?.send({ content: "Your account has been banned by an administrator" });
}