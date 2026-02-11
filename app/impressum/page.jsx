export const metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <div className="prose max-w-none">
      <h1>Impressum</h1>
      <p><strong>Grillmaster Remscheid</strong></p>
      <p>Vieringhausen 6-8<br/>42857 Remscheid<br/>Deutschland</p>

      <h2>Kontakt</h2>
      <p>Telefon: +49 2191 790435<br/>E-Mail: info@musterrestaurant.de</p>

      <h2>Vertreten durch</h2>
      <p>Ibrahim Ceyhan</p>

      <h2>Registereintrag</h2>
      <p>Handelsregister: HRB 00000<br/>Registergericht: Amtsgericht Musterstadt</p>

      <h2>Umsatzsteuer-ID</h2>
      <p>USt-IdNr.: DE000000000</p>

      <p className="text-sm text-gray-600">
        Hinweis: Bitte diese Angaben vor Veröffentlichung mit den echten Daten ersetzen.
      </p>
    </div>
  );
}
