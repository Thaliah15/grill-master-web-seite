export const metadata = { title: "Datenschutzerklärung" };

export default function DatenschutzPage() {
  return (
    <div className="prose max-w-none">
      <h1>Datenschutzerklärung</h1>

      <p>
        Diese Datenschutzerklärung informiert darüber, wie personenbezogene Daten beim Besuch dieser Website verarbeitet
        werden. Wir verarbeiten Daten nach den geltenden Datenschutzgesetzen (insbesondere DSGVO).
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Grillmaster Remscheid<br />
        Vieringhausen 6-8<br />
        42857 Remscheid<br />
        Deutschland
      </p>

      <h2>Welche Daten wir verarbeiten</h2>
      <ul>
        <li>Bestelldaten: Name, Telefonnummer, Adresse (nur bei Lieferung), Bestellinhalt</li>
        <li>Technische Daten: z. B. IP-Adresse, Browserinformationen (Server-Logs)</li>
      </ul>

      <h2>Zweck der Verarbeitung</h2>
      <ul>
        <li>Abwicklung von Bestellungen und Kommunikation mit Kund:innen</li>
        <li>Sicherer Betrieb und Schutz der Website (Logs)</li>
      </ul>

      <h2>Speicherdauer</h2>
      <p>
        Bestelldaten werden nur so lange gespeichert, wie es für die Abwicklung und gesetzliche Pflichten erforderlich ist.
      </p>

      <h2>Cookies</h2>
      <p>
        Wir verwenden ein notwendiges Cookie/LocalStorage-Eintrag, um die Cookie-Einwilligung zu speichern. Ohne Einwilligung
        setzen wir keine Tracking-Cookies.
      </p>

      <h2>Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie
        Widerspruch. Zudem besteht ein Beschwerderecht bei einer Aufsichtsbehörde.
      </p>

      <p className="text-sm text-gray-600">
        Hinweis: Bitte diese Vorlage vor Veröffentlichung rechtlich prüfen und mit echten Daten ergänzen.
      </p>
    </div>
  );
}
