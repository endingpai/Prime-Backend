import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';

const dailyCooldowns = new Map();

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Redeem your daily Vbucks!');

export async function execute(interaction) {
    const userId = interaction.user.id;

    // Check if the user already redeemed their daily V-Bucks
    if (dailyCooldowns.has(userId)) {
        const lastRedeemedTimestamp = dailyCooldowns.get(userId);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds

        // Check if 24 hours have passed since the last redemption
        if (now - lastRedeemedTimestamp < oneDay) {
            const remainingTime = oneDay - (now - lastRedeemedTimestamp);
            const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
            const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
            const remainingSeconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

            return interaction.reply({
                content: `You can redeem your daily Vbucks again in ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s.`,
                ephemeral: true
            });
        }
    }

    // If the user is eligible for the daily reward, proceed to give them 100 VBucks
    const user = await Users.findOne({ discordId: userId });
    if (!user) return interaction.reply({ content: "You do not own an account", ephemeral: true });

    const vbucks = 100; 

    const profile = await Profiles.findOneAndUpdate(
        { accountId: user.accountId },
        { $inc: { 'profiles.common_core.items.Currency.MtxPurchased.quantity': vbucks } },
        { new: true } 
    );
    if (!profile) return interaction.reply({ content: "You do not own an account", ephemeral: true });

    // Update the user's cooldown timestamp
    dailyCooldowns.set(userId, Date.now());

    const updatedVbucks = profile.profiles.common_core.items.Currency.MtxPurchased.quantity;

    const embed = new EmbedBuilder()
        .setTitle("vBucks redeemed")
        .setDescription(`You've successfully redeemed your daily 100 Vbucks!\nYour total Vbucks: ${updatedVbucks}`)
        .setColor("#2b2d31")
        .setFooter({
            text: "Star",
            iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}