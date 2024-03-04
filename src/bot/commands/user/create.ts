import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import functions from "../../../utilities/structs/functions.js";
import log from "../../../utilities/structs/log.js";
import Users from '../../../model/user.js';


const registerChannelId = '1213651793641476096';

export const data = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Creates an account for you')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('The username you want to use')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('email')
            .setDescription('The email you want to use')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('password')
            .setDescription('The password you want to use')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  
    if (interaction.channelId !== registerChannelId) {
        const embed = new EmbedBuilder()
            .setTitle("Error On this Command")
            .setDescription("This command is only allowed in the register channel.")
            .setColor("#0036a3"); 

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const username = interaction.options.getString('username');
    const email = interaction.options.getString('email');
    const plainPassword = interaction.options.getString('password');
    const discordTag = interaction.user.tag;
    const avatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 256 });

    const user = await Users.findOne({ discordId: interaction.user.id });
    if (user) return interaction.editReply({ content: "You are already registered!" });

    await functions.registerUser(discordId, username!, email!, plainPassword!, false).then(async (res) => {

        const embed = new EmbedBuilder()
            .setTitle("Account created")
            .setDescription("Your account has been successfully created Enjoy Project Star")
            .addFields(
                {
                    name: "Username",
                    value: username!,
                    inline: false
                },
                {
                    name: "Email",
                    value: email!,
                    inline: false
                },
                {
                    name: "Discord Tag",
                    value: discordTag,
                    inline: false
                    
                }
            )
            .setColor("#0036a3")
            .setFooter({
                text: "Star",
                iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
            })
            .setTimestamp()
            .setThumbnail(avatarURL); 

        await interaction.editReply({ content: res.message });

        const publicEmbed = new EmbedBuilder()
            .setTitle("Welcome to Star")
            .setDescription("Thank you for registering")
            .addFields(
                {
                    name: "Username",
                    value: username!,
                },
                {
                    name: "Discord Tag",
                    value: discordTag,
                }
            )
            .setColor("#0036a3")
            .setFooter({
                text: "Prime",
                iconURL: "https://cdn.discordapp.com/attachments/1211397200454885446/1214026648786178048/pr1bhge5-removebg-preview.png?ex=65f79d6c&is=65e5286c&hm=0496cd7fc53656269d7a70e6c3b78bfffca1281d930170927f262b50ed049d7e&",
            })
            .setTimestamp()
            .setThumbnail(avatarURL); 

        await interaction.channel?.send({ embeds: [publicEmbed] });
    }).catch((err) => {
        log.error(err);
    });
}
