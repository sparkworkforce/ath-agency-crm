import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | CobraHub",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto prose py-12 px-4">
      <Link href="/" className="text-sm no-underline hover:underline">
        ← Volver al inicio
      </Link>

      <h1>Política de Privacidad</h1>
      <p className="text-sm text-gray-500">
        Última actualización: abril 2026
      </p>

      <p>
        Spark Workforce LLC (&quot;la Empresa&quot;) opera la plataforma CobraHub. Esta política describe cómo recopilamos, usamos y protegemos su
        información personal.
      </p>

      <h2>1. Datos que Recopilamos</h2>
      <ul>
        <li>
          <strong>Información de cuenta:</strong> nombre, correo electrónico y
          contraseña.
        </li>
        <li>
          <strong>Información comercial:</strong> nombre de la empresa, datos de
          contacto y detalles de proyectos de integración ATH Business.
        </li>
        <li>
          <strong>Datos de pago:</strong> procesados directamente por Stripe. No
          almacenamos números de tarjeta en nuestros servidores.
        </li>
        <li>
          <strong>Datos de uso:</strong> registros de acceso y actividad dentro
          de la plataforma.
        </li>
      </ul>

      <h2>2. Cómo Usamos sus Datos</h2>
      <ul>
        <li>Proveer y mantener el Servicio.</li>
        <li>Procesar pagos y gestionar suscripciones.</li>
        <li>Enviar comunicaciones transaccionales (confirmaciones, alertas).</li>
        <li>Mejorar la plataforma y la experiencia del usuario.</li>
      </ul>

      <h2>3. Compartición de Datos</h2>
      <p>
        No vendemos su información personal. Solo compartimos datos con los
        siguientes procesadores, estrictamente necesarios para operar el
        Servicio:
      </p>
      <ul>
        <li>
          <strong>Stripe:</strong> procesamiento de pagos.
        </li>
        <li>
          <strong>Resend:</strong> envío de correos electrónicos
          transaccionales.
        </li>
        <li>
          <strong>Supabase:</strong> almacenamiento de base de datos y archivos.
        </li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        Utilizamos únicamente cookies de sesión necesarias para la autenticación
        y el funcionamiento de la plataforma. No utilizamos cookies de
        seguimiento ni de publicidad.
      </p>

      <h2>5. Retención de Datos</h2>
      <p>
        Conservamos sus datos mientras su cuenta esté activa. Tras la
        cancelación de la cuenta, los datos se eliminan dentro de los 90 días
        siguientes, salvo que la ley requiera su conservación por un período
        mayor.
      </p>

      <h2>6. Sus Derechos</h2>
      <p>Usted tiene derecho a:</p>
      <ul>
        <li>
          <strong>Acceso:</strong> solicitar una copia de los datos personales
          que tenemos sobre usted.
        </li>
        <li>
          <strong>Eliminación:</strong> solicitar la eliminación de su cuenta y
          datos personales.
        </li>
      </ul>
      <p>
        Para ejercer estos derechos, contáctenos en{" "}
        <a href="mailto:legal@cobrahub.io">legal@cobrahub.io</a>.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Implementamos medidas de seguridad técnicas y organizativas para
        proteger sus datos, incluyendo cifrado en tránsito y en reposo. Sin
        embargo, ningún sistema es completamente seguro.
      </p>

      <h2>8. Cambios a esta Política</h2>
      <p>
        Podemos actualizar esta política periódicamente. Le notificaremos sobre
        cambios materiales por correo electrónico o mediante un aviso en la
        plataforma.
      </p>

      <h2>Contacto</h2>
      <p>
        Para preguntas sobre esta política, contáctenos en{" "}
        <a href="mailto:legal@cobrahub.io">legal@cobrahub.io</a>.
      </p>
    </main>
  );
}
