import { APIActionRowComponent, APIButtonComponent, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
import Friends from '../../../model/friends.js';

export const data = new SlashCommandBuilder()
    .setName('deleteaccount')
    .setDescription('Deletes your account (irreversible)');

export async function execute(interaction: ChatInputCommandInteraction) {

    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user) return interaction.reply({ content: "You are not registered!", ephemeral: true });
    if(user.banned) return interaction.reply({ content: "You are banned, and your account cannot therefore be deleted.", ephemeral: true } );

    const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Confirm Deletion')
        .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

    const row: APIActionRowComponent<APIButtonComponent> = {
        type: 1,
        components: [confirm.toJSON(), cancel.toJSON()]
    }

    const confirmationEmbed = new EmbedBuilder()
        .setTitle("Are you sure you want to delete your account?")
        .setDescription("This action is irreversible, and will delete all your data.")
        .setColor("#0036a3")
        .setFooter({
            text: "Star",
            iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
        })
        .setTimestamp();

    const confirmationResponse = await interaction.reply({
        embeds: [confirmationEmbed],
        components: [row],
        ephemeral: true
    });

    const filter = (i) => i.user.id === interaction.user.id;

    const collector = confirmationResponse.createMessageComponentCollector({ filter, time: 10000 });

    collector.on("collect", async (i) => {
        switch (i.customId) {
            case "confirm": {
                await Users.findOneAndDelete({ discordId: interaction.user.id });
                await Profiles.findOneAndDelete({ accountId: user.accountId });
                await Friends.findOneAndDelete({ accountId: user.accountId });

                const confirmEmbed = new EmbedBuilder()
                    .setTitle("Account Deleted")
                    .setDescription("Your account has been deleted, we're sorry to see you go!")
                    .setColor("#0036a3")
                    .setFooter({
                        text: "Star",
                        iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
                    })
                    .setTimestamp();

                i.reply({ embeds: [confirmEmbed], ephemeral: true });
                break;
            }
            case "cancel": {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("Account Deletion Cancelled")
                    .setDescription("Your account has not been deleted.")
                    .setColor("#0036a3")
                    .setFooter({
                        text: "Star",
                        iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
                    })
                    .setTimestamp();

                i.reply({ embeds: [cancelEmbed], ephemeral: true });
                break;
            }
        }


    })

}
