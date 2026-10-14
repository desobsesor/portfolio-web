/**
 * Aviso por email de un contacto nuevo — best-effort, sólo servidor.
 *
 * El import de `resend` es dinámico y va después de comprobar la clave: el
 * paquete arrastra dependencias de React que no hacen falta para el resto del
 * servidor, y cargándolo sólo cuando hay `RESEND_API_KEY` el build del servidor
 * no tiene que resolverlas. Sin clave no se envía nada: el contacto ya quedó
 * guardado en MongoDB igualmente.
 */

/** Escapa el texto interpolado en el HTML del aviso. */
function escaparHtml(entrada: string): string {
  return entrada
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function enviarAvisoContacto(datos: {
  nombre: string;
  email: string;
  mensaje: string;
}): Promise<void> {
  const clave = process.env['RESEND_API_KEY'] ?? '';
  if (!clave) return;

  const { Resend } = await import('resend');
  const destino = process.env['CONTACT_AVISO_PARA'] ?? 'yovanysuarezsilva@gmail.com';
  const cliente = new Resend(clave);

  await cliente.emails.send({
    from: 'Portfolio Contact <onboarding@resend.dev>',
    to: destino,
    subject: `Nuevo contacto de ${datos.nombre}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escaparHtml(datos.nombre)}</p>
      <p><strong>Email:</strong> ${escaparHtml(datos.email)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escaparHtml(datos.mensaje).replace(/\n/g, '<br>')}</p>
    `,
  });
}