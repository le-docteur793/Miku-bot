export async function handleInteraction(
  interaction,
  context,
) {
  try {
    if (interaction.isChatInputCommand()) {
      const command =
        context.client.commands.get(
          interaction.commandName,
        );

      if (!command) {
        return replyError(
          interaction,
          'Commande inconnue.',
        );
      }

      return command.execute(
        interaction,
        context,
      );
    }

    if (interaction.isButton()) {
      if (
        interaction.customId ===
        'ticket_open'
      ) {
        return openTicket(
          interaction,
          context,
        );
      }

      if (
        interaction.customId ===
        'ticket_close'
      ) {
        return closeTicket(
          interaction,
          context,
        );
      }

      if (
        interaction.customId ===
        'application_open'
      ) {
        return showApplicationModal(
          interaction,
        );
      }

      if (
        interaction.customId.startsWith(
          'application_accept:',
        )
      ) {
        return reviewApplication(
          interaction,
          context,
          true,
        );
      }

      if (
        interaction.customId.startsWith(
          'application_reject:',
        )
      ) {
        return reviewApplication(
          interaction,
          context,
          false,
        );
      }

      if (
        interaction.customId.startsWith(
          'role_toggle:',
        )
      ) {
        return toggleRole(
          interaction,
          context,
        );
      }
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId ===
        'application_submit'
    ) {
      return submitApplication(
        interaction,
        context,
      );
    }
  } catch (error) {
    console.error(
      '[INTERACTION] Erreur :',
      error,
    );

    return replyError(
      interaction,
      'Une erreur est survenue. Vérifie la console de l’hébergeur.',
    ).catch(() => null);
  }
}