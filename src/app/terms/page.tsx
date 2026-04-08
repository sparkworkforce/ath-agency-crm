import Link from "next/link";

export const metadata = {
  title: "Términos de Servicio | CobraHub",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto prose py-12 px-4">
      <Link href="/" className="text-sm no-underline hover:underline">
        ← Volver al inicio
      </Link>

      <h1>Términos de Servicio</h1>
      <p className="text-sm text-gray-500">
        Última actualización: abril 2026
      </p>

      <h2>1. Aceptación de los Términos</h2>
      <p>
        Al acceder o utilizar la plataforma CobraHub (&quot;el Servicio&quot;),
        operada por Spark Workforce LLC (&quot;la Empresa&quot;), usted acepta
        quedar vinculado por estos Términos de Servicio. Si no está de acuerdo,
        no utilice el Servicio.
      </p>

      <h2>2. Descripción del Servicio</h2>
      <p>
        CobraHub es una plataforma SaaS multi-tenant de gestión de agencias
        especializada en integraciones de pagos ATH Business en Puerto Rico.
        Permite a las agencias administrar proyectos, clientes y procesos de
        integración.
      </p>

      <h2>3. Cuentas de Usuario</h2>
      <p>
        Usted es responsable de mantener la confidencialidad de sus credenciales
        de acceso y de todas las actividades que ocurran bajo su cuenta. Debe
        notificarnos inmediatamente sobre cualquier uso no autorizado. Nos
        reservamos el derecho de suspender cuentas que violen estos términos.
      </p>

      <h2>4. Suscripción y Facturación</h2>
      <p>
        El acceso al Servicio puede requerir una suscripción de pago. Los cargos
        se facturan de forma recurrente según el plan seleccionado. Los pagos no
        son reembolsables salvo que la ley aplicable lo requiera. Nos reservamos
        el derecho de modificar los precios con un aviso previo de 30 días.
      </p>

      <h2>5. Propiedad de los Datos</h2>
      <p>
        Usted retiene todos los derechos sobre los datos que ingrese en la
        plataforma. La Empresa no reclama propiedad sobre su contenido. Le
        otorgamos una licencia limitada para usar el Servicio, y usted nos
        otorga una licencia limitada para procesar sus datos únicamente con el
        fin de proveer el Servicio.
      </p>

      <h2>6. Uso Aceptable</h2>
      <p>
        Usted se compromete a no utilizar el Servicio para actividades ilegales,
        no enviar contenido malicioso, no intentar acceder a cuentas de otros
        usuarios, y no interferir con el funcionamiento de la plataforma.
      </p>

      <h2>7. Limitación de Responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, la Empresa no será responsable
        por daños indirectos, incidentales, especiales o consecuentes derivados
        del uso del Servicio. La responsabilidad total de la Empresa no excederá
        el monto pagado por usted en los últimos 12 meses.
      </p>

      <h2>8. Terminación</h2>
      <p>
        Cualquiera de las partes puede terminar esta relación en cualquier
        momento. Usted puede cancelar su cuenta desde la configuración de la
        plataforma. La Empresa puede suspender o terminar su acceso por
        violación de estos términos. Tras la terminación, sus datos serán
        eliminados conforme a nuestra Política de Privacidad.
      </p>

      <h2>9. Modificaciones</h2>
      <p>
        Podemos actualizar estos términos periódicamente. Le notificaremos sobre
        cambios materiales por correo electrónico o mediante un aviso en la
        plataforma. El uso continuado del Servicio constituye aceptación de los
        términos modificados.
      </p>

      <h2>10. Ley Aplicable</h2>
      <p>
        Estos términos se rigen por las leyes del Estado Libre Asociado de
        Puerto Rico.
      </p>

      <h2>Contacto</h2>
      <p>
        Para preguntas sobre estos términos, contáctenos en{" "}
        <a href="mailto:legal@cobrahub.io">legal@cobrahub.io</a>.
      </p>
    </main>
  );
}
