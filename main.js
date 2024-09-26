const { Client, IntentsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, InteractionType } = require('discord.js');
const fs = require('fs');

// Stwórz klienta Discord
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`${client.user.tag} jest online!`);
});

// Logowanie klienta

let selectedColor = null;
let selectedName = null;

const roleColorMap = {
    black: { hex: '#000000', discordColor: 0x000000 },
    red: { hex: '#FF0000', discordColor: 0xFF0000 },
    green: { hex: '#00FF00', discordColor: 0x00FF00 },
    blue: { hex: '#0000FF', discordColor: 0x0000FF },
    yellow: { hex: '#FFFF00', discordColor: 0xFFFF00 },
    pink: { hex: '#FFC0CB', discordColor: 0xFFC0CB },
    purple: { hex: '#800080', discordColor: 0x800080 },
    orange: { hex: '#FFA500', discordColor: 0xFFA500 },
    gray: { hex: '#808080', discordColor: 0x808080 },
    white: { hex: '#FFFFFF', discordColor: 0xFFFFFF }
};

// Ścieżka do pliku JSON
const rolesFilePath = './roles.json';

// Funkcja do wczytania ról z pliku JSON
function loadRoles() {
    if (fs.existsSync(rolesFilePath)) {
        const rawData = fs.readFileSync(rolesFilePath);
        return JSON.parse(rawData);
    }
    return {};
}

// Funkcja do zapisu ról do pliku JSON
function saveRoles(roles) {
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 4));
}

// Wczytaj zapisane role
let userRolesMap = loadRoles();

// Obsługa wyboru opcji
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'pick_option') {
        const selected = interaction.values[0]; // Wybrana wartość

        if (selected === 'color') {
            // Tworzenie embeda z wyborem koloru
            const pickColorEmbed = new EmbedBuilder()
                .setTitle('Wybierz kolor')
                .setColor(0x000000)
                .setDescription('Wybierz kolor, jaki ma posiadać twoja ranga!');

            const colorSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('pick_color')
                .setPlaceholder('Wybierz kolor')
                .addOptions([
                    { label: 'Czarny', description: 'Czarny kolor dla twojej rangi', value: 'black' },
                    { label: 'Czerwony', description: 'Czerwony kolor dla twojej rangi', value: 'red' },
                    { label: 'Zielony', description: 'Zielony kolor dla twojej rangi', value: 'green' },
                    { label: 'Niebieski', description: 'Niebieski kolor dla twojej rangi', value: 'blue' },
                    { label: 'Żółty', description: 'Żółty kolor dla twojej rangi', value: 'yellow' },
                    { label: 'Różowy', description: 'Różowy kolor dla twojej rangi', value: 'pink' },
                    { label: 'Fioletowy', description: 'Fioletowy kolor dla twojej rangi', value: 'purple' },
                    { label: 'Pomarańczowy', description: 'Pomarańczowy kolor dla twojej rangi', value: 'orange' },
                    { label: 'Szary', description: 'Szary kolor dla twojej rangi', value: 'gray' },
                    { label: 'Biały', description: 'Biały kolor dla twojej rangi', value: 'white' }
                ]);

            // Tworzenie ActionRow dla wyboru koloru
            const colorRow = new ActionRowBuilder().addComponents(colorSelectMenu);

            // Odpowiedź z wyborem koloru
            await interaction.reply({
                embeds: [pickColorEmbed],
                components: [colorRow],
                ephemeral: true // tylko dla użytkownika
            });
        } else if (selected === 'name') {
            // Tworzenie modala do wpisania nazwy
            const modal = new ModalBuilder()
                .setCustomId('name_modal')
                .setTitle('Wybierz nazwę dla rangi');

            const nameInput = new TextInputBuilder()
                .setCustomId('name_input')
                .setLabel('Podaj nazwę rangi:')
                .setStyle(TextInputStyle.Short);

            const modalRow = new ActionRowBuilder().addComponents(nameInput);

            modal.addComponents(modalRow);

            await interaction.showModal(modal);
        }
    }

    // Obsługa wyboru koloru
    if (interaction.customId === 'pick_color') {
        selectedColor = interaction.values[0];
        console.log(`Wybrano kolor: ${selectedColor}`);

        const selectedEmbedColor = roleColorMap[selectedColor].discordColor;

        // Sprawdzenie, czy już jest wybrana nazwa
        if (selectedName) {
            await createRole(interaction);
        } else {
            const colorEmbed = new EmbedBuilder()
                .setColor(selectedEmbedColor)
                .setDescription(`Kolor **${selectedColor}** został wybrany. Teraz wybierz nazwę.`);

            await interaction.reply({ embeds: [colorEmbed], ephemeral: true });
        }
    }
});

// Obsługa modala do wpisania nazwy
client.on('interactionCreate', async (interaction) => {
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'name_modal') {
        selectedName = interaction.fields.getTextInputValue('name_input');
        console.log(`Wybrano nazwę: ${selectedName}`);

        const selectedEmbedColor = roleColorMap[selectedColor]?.discordColor || 0x000000;

        // Sprawdzenie, czy już jest wybrany kolor
        if (selectedColor) {
            await createRole(interaction);
        } else {
            const nameEmbed = new EmbedBuilder()
                .setColor(selectedEmbedColor)
                .setDescription(`Nazwa **${selectedName}** została wybrana. Teraz wybierz kolor.`);

            await interaction.reply({ embeds: [nameEmbed], ephemeral: true });
        }
    }
});

// Funkcja do tworzenia roli
async function createRole(interaction) {
    try {
        const guild = interaction.guild;
        const member = interaction.member;

        // Sprawdzenie, czy użytkownik już ma utworzoną rolę
        const existingRoleId = userRolesMap[member.id];
        if (existingRoleId) {
            const existingRole = guild.roles.cache.get(existingRoleId);
            if (existingRole) {
                // Usuwanie starej roli
                await existingRole.delete('Stara rola użytkownika została usunięta');
                console.log(`Usunięto starą rolę: ${existingRole.name}`);
            }
        }

        // Tworzenie nowej roli
        const newRole = await guild.roles.create({
            name: selectedName,
            color: roleColorMap[selectedColor].discordColor,
            reason: `Rola utworzona przez użytkownika ${member.user.tag}`
        });

        // Przypisywanie nowej roli użytkownikowi
        await member.roles.add(newRole);
        console.log(`Przypisano nową rolę: ${newRole.name} użytkownikowi ${member.user.tag}`);

        // Zapis ID nowej roli do pliku JSON
        userRolesMap[member.id] = newRole.id;
        saveRoles(userRolesMap);

        // Odpowiedź na interakcję z sukcesem
        const successEmbed = new EmbedBuilder()
            .setColor(newRole.color)
            .setDescription(`Nowa rola **${newRole.name}** została stworzona i przypisana!`);

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
        console.error('Błąd podczas tworzenia roli:', error);
    }
}
