const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const TOURNAMENT_CHANNEL_ID = '1474714934293041344';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel, Partials.Message]
});

app.post('/api/apply', async (req, res) => {
    const { name, captain, tier } = req.body;
    
    try {
        const channel = await client.channels.fetch(TOURNAMENT_CHANNEL_ID);
        if (!channel) return res.status(500).send('Channel not found');

        const embed = new EmbedBuilder()
            .setTitle(`New Tournament Application: ${name}`)
            .setColor(0xd29922)
            .addFields(
                { name: 'Team Name', value: name, inline: true },
                { name: 'Captain', value: captain, inline: true },
                { name: 'Tested Tier', value: tier, inline: true },
                { name: 'PC Check Consent', value: 'Yes', inline: true }
            )
            .setTimestamp();

        const acceptBtn = new ButtonBuilder()
            .setCustomId(`accept_app_${captain}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const denyBtn = new ButtonBuilder()
            .setCustomId(`deny_app_${captain}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptBtn, denyBtn);

        await channel.send({ embeds: [embed], components: [row] });
        res.status(200).send('Application sent to Discord.');
    } catch (error) {
        res.status(500).send('Error sending application.');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('accept_app_') || interaction.customId.startsWith('deny_app_')) {
        const isAccept = interaction.customId.startsWith('accept_app_');
        const captainName = interaction.customId.split('_')[2];

        const oldEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed)
            .setColor(isAccept ? 0x238636 : 0xda3633)
            .setTitle(`Application ${isAccept ? 'Accepted' : 'Denied'}: ${oldEmbed.fields[0].value}`)
            .addFields({ name: 'Reviewed By', value: `${interaction.user.tag}` });

        await interaction.update({ embeds: [updatedEmbed], components: [] });
    }
});

client.once('ready', () => {
    console.log(`Tournament bot logged in as ${client.user.tag}`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`API Server running on port ${port}`);
});

client.login(process.env.TOKEN);
