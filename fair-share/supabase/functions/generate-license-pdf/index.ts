import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Contract Data
    const { data: c, error } = await supabase
      .from("reaction_contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    if (!c) {
      console.error("❌ Contract not found");
      throw new Error("Contract not found");
    }

    // 3. Fetch Profiles
    const { data: licensorProfile, error: licensorProfileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", c.licensor_id)
        .single();

    if (licensorProfileError) {
      console.error(
        "Warning: Licensor profile fetch error",
        licensorProfileError,
      );
    }

    const { data: licenseeProfile, error: licenseeProfileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", c.licensee_id)
        .single();

    if (licenseeProfileError) {
      console.error(
        "Warning: Licensee profile fetch error",
        licenseeProfileError,
      );
    }

    // 4. Fetch Emails
    const { data: licensorData, error: licensorError } = await supabase.auth
      .admin.getUserById(c.licensor_id);

    const { data: licenseeData, error: licenseeError } = await supabase.auth
      .admin.getUserById(c.licensee_id);

    if (licensorError) {
      console.error("❌ Licensor email fetch error", licensorError);
    }
    if (licenseeError) {
      console.error("❌ Licensee email fetch error", licenseeError);
    }

    const licensorUser = licensorData?.user;
    const licenseeUser = licenseeData?.user;

    const licensorEmail = licensorUser?.email;
    const licenseeEmail = licenseeUser?.email;

    if (!licensorEmail || !licenseeEmail) {
      throw new Error("Missing email addresses for parties");
    }

    const licensor = { ...licensorProfile, email: licensorEmail };
    const licensee = { ...licenseeProfile, email: licenseeEmail };

    // Construct Channel URLs (Fallbacks if not present directly)
    const licensorChannelUrl = licensor?.youtube_channel_id
      ? `https://www.youtube.com/channel/${licensor.youtube_channel_id}`
      : (licensor?.channel_url || "N/A");

    const licenseeChannelUrl = licensee?.youtube_channel_id
      ? `https://www.youtube.com/channel/${licensee.youtube_channel_id}`
      : (licensee?.channel_url || "N/A");

    // Video Details
    const videoTitle = c.original_video_title || c.video_title ||
      "Unbekannter Titel";
    const videoUrl = c.original_video_url || c.video_url || "N/A";
    const videoDuration = c.original_video_duration || c.video_duration ||
      "N/A";
    const videoExternalId = c.original_video_id || c.video_external_id || "N/A";
    // Ideally fetch upload date, defaulting to created_at if not available
    const videoUploadDate = c.original_video_date
      ? new Date(c.original_video_date).toLocaleDateString("de-DE")
      : new Date(c.created_at).toLocaleDateString("de-DE");

    // Currency Formatter
    const currency = c.pricing_currency || "EUR";
    const formatMoney = (val: number) =>
      new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(
        val,
      );

    // Pricing Logic for Legal Text
    let selectedModel = "Unbekannt";
    let pricingDetails = "";

    if (c.pricing_model_type === 1) {
      selectedModel = "Modell 1: Festpreis (Buy-Out)";
      pricingDetails = `${formatMoney(c.pricing_value)}`;
    } else if (c.pricing_model_type === 2) {
      selectedModel = "Modell 2: Pay-per-1.000-Views";
      pricingDetails = `${formatMoney(c.pricing_value)} pro 1.000 Views`;
    } else if (c.pricing_model_type === 3) {
      selectedModel = "Modell 3: CPM-basiert";
      pricingDetails = `${c.pricing_value}% des CPM (Geschätzt)`;
    }

    // 5. Generate HTML Content (New Legal Text)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; line-height: 1.6; font-size: 11px; color: #333; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; font-size: 16px; margin-bottom: 5px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h2 { font-size: 13px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
            h3 { font-size: 11px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
            p { margin: 5px 0; }
            ul { margin: 5px 0; padding-left: 20px; }
            li { margin-bottom: 3px; }
            .meta { font-size: 10px; text-align: right; color: #666; margin-bottom: 20px; }
            .preamble { font-style: italic; margin-bottom: 20px; text-align: justify; }
            .section { margin-bottom: 15px; }
            .party-box { background: #f9f9f9; padding: 10px; border: 1px solid #eee; margin-bottom: 10px; }
            strong { color: #000; }
          </style>
        </head>
        <body>
          <h1>LIZENZVERTRAG FÜR REACTION-VIDEO-NUTZUNG</h1>
          
          <p class="meta">
            Vertragsnummer: <strong>${c.id}</strong><br>
            Datum: <strong>${
      new Date(c.created_at).toLocaleDateString("de-DE")
    }</strong>
          </p>

          <div class="preamble">
            <strong>Präambel</strong><br>
            Dieser Lizenzvertrag regelt die Einräumung von Nutzungsrechten an urheberrechtlich geschützten Videoinhalten ("Original-Werk") für die Erstellung und Verbreitung von Reaction-Videos. Die Lizenzierung erfolgt über die Plattform <strong>FairShare</strong>, die als Vermittler und Zahlungsabwickler fungiert. Die Vergütung wird mittels des Algorithmus "calculateFairShare" ermittelt, der eine faire Aufteilung zwischen schöpferischer Leistung und Marktmacht beider Parteien gewährleistet.
          </div>

          <h2>§ 1 Vertragsparteien</h2>
          
          <div class="section">
            <div class="party-box">
              <p><strong>1.1 Lizenzgeber (Original-Creator)</strong></p>
              <p>Name: ${licensor?.full_name || "N/A"}<br>
              Anschrift: ${licensor?.address_street || ""} ${
      licensor?.address_number || ""
    }, ${licensor?.address_zip || ""} ${licensor?.address_city || ""}<br>
              Channel: ${licensorChannelUrl}<br>
              E-Mail: ${licensorEmail}</p>
            </div>

            <div class="party-box">
              <p><strong>1.2 Lizenznehmer (Reactor)</strong></p>
              <p>Name: ${licensee?.full_name || "N/A"}<br>
              Anschrift: ${licensee?.address_street || ""} ${
      licensee?.address_number || ""
    }, ${licensee?.address_zip || ""} ${licensee?.address_city || ""}<br>
              Channel: ${licenseeChannelUrl}<br>
              E-Mail: ${licenseeEmail}</p>
            </div>

            <div class="party-box">
              <p><strong>1.3 Plattformbetreiber</strong></p>
              <p>Name: FairShare<br>
              Anschrift: Musterstraße 1, 10115 Berlin<br>
              E-Mail: support@fairshare.dev<br>
              Website: https://fairshare.dev</p>
            </div>
          </div>

          <h2>§ 2 Gegenstand der Lizenz</h2>
          <div class="section">
            <p><strong>2.1 Lizenziertes Werk</strong></p>
            <p>Gegenstand dieser Lizenz ist das folgende urheberrechtlich geschützte Werk:</p>
            <ul>
              <li>Titel des Werkes: <strong>${videoTitle}</strong></li>
              <li>URL: ${videoUrl}</li>
              <li>Upload-Datum: ${videoUploadDate}</li>
              <li>Dauer: ${videoDuration}</li>
              <li>Eindeutige ID: ${videoExternalId}</li>
            </ul>

            <p><strong>2.2 Art des Nutzungsrechts</strong></p>
            <p>Der Lizenzgeber räumt dem Lizenznehmer ein einfaches (nicht-ausschließliches) Nutzungsrecht am Original-Werk ein. Der Lizenzgeber behält alle Rechte am Werk und kann es weiterhin selbst nutzen sowie Dritten weitere Lizenzen einräumen.</p>
          </div>

          <h2>§ 3 Umfang der eingeräumten Nutzungsrechte</h2>
          <div class="section">
            <p><strong>3.1 Nutzungsarten</strong></p>
            <p>Der Lizenznehmer erhält das Recht zur:</p>
            <ul>
              <li><strong>Vervielfältigung:</strong> Kopieren und Einbinden des Original-Werkes in eigene Dateien und Produktionen.</li>
              <li><strong>Bearbeitung und Umgestaltung:</strong> Zuschneiden, Pausieren, Kommentieren, Einblenden von Overlays, Facecam, Memes, grafischen Elementen und Soundeffekten; Synchronisation mit eigenem Kommentar und Reaktions-Content.</li>
              <li><strong>Öffentliche Zugänglichmachung:</strong> Veröffentlichung des Reaction-Videos auf Online-Video-Plattformen (YouTube, Twitch, TikTok, Instagram Reels, Facebook, eigene Website und vergleichbare Dienste).</li>
              <li><strong>Nutzung von Ausschnitten und Thumbnails:</strong> Verwendung von Video-Frames, Thumbnails und Ausschnitten des Original-Werkes als Vorschau oder Werbematerial für das Reaction-Video.</li>
            </ul>

            <p><strong>3.2 Geografischer Umfang</strong></p>
            <p>Die Nutzungsrechte gelten weltweit.</p>

            <p><strong>3.3 Plattformen und Nutzungsarten</strong></p>
            <p>Die Nutzung ist auf folgenden Plattformen gestattet: YouTube, Twitch, TikTok, Instagram, Facebook, Twitter/X, eigene Website sowie funktional vergleichbare Online-Video-Plattformen und Streaming-Dienste.</p>
            <p><em>Wichtig: Eine Einräumung von Rechten an bislang unbekannten Nutzungsarten im Sinne von § 31a UrhG erfolgt durch diesen Vertrag nicht. Sollten die Parteien Rechte für unbekannte Nutzungsarten einräumen wollen, bedarf dies einer gesonderten Vereinbarung in Schriftform gemäß § 126 BGB.</em></p>

            <p><strong>3.4 Vertragsdauer</strong></p>
            <p>Die Lizenz wird eingeräumt für einen Zeitraum von: <strong>unbefristet</strong>, vorbehaltlich der Kündigungsrechte gemäß § 9.</p>

            <p><strong>3.5 Unterlizenzen</strong></p>
            <p>Der Lizenznehmer ist nicht berechtigt, die eingeräumten Nutzungsrechte auf Dritte zu übertragen oder Unterlizenzen zu vergeben, mit Ausnahme der technisch notwendigen Rechteübertragung an Plattformbetreiber zur Veröffentlichung des Reaction-Videos.</p>
          </div>

          <h2>§ 4 Bearbeitungsrechte und inhaltliche Grenzen</h2>
          <div class="section">
            <p><strong>4.1 Erlaubte Bearbeitungen</strong></p>
            <ul>
              <li>Pausieren und kommentieren des Original-Videos</li>
              <li>Einblenden von Facecam, Avatar oder Bild-in-Bild-Darstellung</li>
              <li>Einfügen von Memes, Grafiken, Texteinblendungen, Soundeffekten</li>
              <li>Kürzen, Loopen oder Wiederholen von Ausschnitten</li>
              <li>Einbindung von Live-Chat oder Community-Reaktionen</li>
            </ul>

            <p><strong>4.2 Verbotene Nutzungen</strong></p>
            <p>Ausdrücklich untersagt sind: Entstellende, ehrverletzende, rassistische, sexistische oder diskriminierende Bearbeitungen; Nutzung für politische Hetze oder Hassrede; irreführende Darstellung; Rufschädigung; vollständiger Re-Upload ohne substantielle eigene Leistung.</p>

            <p><strong>4.3 Urheberpersönlichkeitsrecht</strong></p>
            <p>Der Lizenznehmer verpflichtet sich, das Urheberpersönlichkeitsrecht des Lizenzgebers zu wahren.</p>
          </div>

          <h2>§ 5 Pflicht zur Nennung (Attribution)</h2>
          <div class="section">
             <p>Der Lizenznehmer verpflichtet sich zur Nennung des Original-Creators in der Videobeschreibung (Name/Channel + Link) und optional im Video selbst.</p>
             <p>Beispiel: <em>"Original-Video von ${
      licensor?.full_name || "Name"
    }: ${videoUrl}"</em></p>
          </div>

          <h2>§ 6 Vergütung und Vergütungsmodelle</h2>
          <div class="section">
            <p><strong>6.1 Berechnung durch calculateFairShare</strong></p>
            <p>Die Vergütung basiert auf dem "calculateFairShare"-System, das Marktmacht und schöpferische Leistung beider Parteien analysiert.</p>

            <p><strong>6.2 & 6.3 Gewähltes Modell</strong></p>
            <p>Für diesen Vertrag gilt:</p>
            <p style="background: #eef; padding: 10px; border: 1px solid #dde;">
               <strong>${selectedModel}</strong><br>
               Vergütung: <strong>${pricingDetails}</strong>
            </p>
          </div>

          <h2>§ 7 Zahlungsabwicklung und Provision</h2>
          <div class="section">
            <p>Alle Zahlungen erfolgen über FairShare. FairShare erhebt eine Provision von 5% der Netto-Vergütung für Bereitstellung, Abwicklung und Support. Die Auszahlung an den Lizenzgeber erfolgt ab 20 Euro.</p>
          </div>

          <h2>§ 8 Transparenz und Reporting</h2>
          <div class="section">
            <p>Bei Modell 2 & 3 ist der Lizenznehmer verpflichtet, quartalsweise View-Zahlen zu melden (z.B. via Screenshot).</p>
          </div>

          <h2>§ 9 Kündigung und Takedown</h2>
          <div class="section">
            <p>Bei Kündigung erlischt das Nutzungsrecht. Es gilt eine <strong>Nachlauffrist von 7 Tagen</strong> zur technischen Entfernung (Takedown).</p>
          </div>

          <h2>§ 10 Pauschalierter Schadensersatz</h2>
          <div class="section">
            <p>Bei unberechtigter Nutzung: Pauschale in Höhe des Zweifachen der Lizenzgebühr.</p>
          </div>

          <h2>§ 11 & 12 Gewährleistung und Haftung</h2>
          <div class="section">
            <p>Der Lizenzgeber sichert zu, Inhaber der Rechte zu sein. Der Lizenznehmer sichert zu, keine Rechte Dritter zu verletzen. Beide Parteien stellen sich gegenseitig von Ansprüchen Dritter frei.</p>
          </div>

          <h2>§ 17 Gerichtsstand</h2>
          <div class="section">
             <p>Sitz des Plattformbetreibers (für Kaufleute). Deutsches Recht.</p>
          </div>

          <h2>§ 18 Elektronische Zustimmung</h2>
          <div class="section" style="border-top: 2px solid #000; padding-top: 15px;">
            
            <div style="margin-bottom: 20px;">
                <p><strong>Lizenzgeber (Original-Creator)</strong></p>
                <p>Name: ${licensor?.full_name || "N/A"}<br>
                Datum: ${new Date(c.created_at).toLocaleDateString("de-DE")}<br>
                Bestätigung: <em>Elektronisch zugestimmt via FairShare Platform</em></p>
            </div>

            <div style="margin-bottom: 20px;">
                <p><strong>Lizenznehmer (Reactor)</strong></p>
                <p>Name: ${licensee?.full_name || "N/A"}<br>
                Datum: ${new Date(c.created_at).toLocaleDateString("de-DE")}<br>
                Bestätigung: <em>Elektronisch zugestimmt via FairShare Platform</em></p>
            </div>

            <div>
                <p><strong>Plattformbetreiber (FairShare)</strong></p>
                <p>Datum: ${
      new Date(c.created_at).toLocaleDateString("de-DE")
    }<br>
                Bestätigung: <em>Automatische Vertragsbestätigung durch System</em></p>
            </div>

          </div>

          <br><br>
          <div style="font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 10px;">
            <p><strong>Hinweis zur Schriftform (§ 31a UrhG):</strong> Dieser Vertrag gilt für bekannte Nutzungsarten (Textform ausreichend). Unbekannte Nutzungsarten bedürfen der Schriftform.</p>
            <p><strong>Hinweis für Verbraucher:</strong> Es gelten die gesetzlichen Widerrufsrechte.</p>
          </div>
        </body>
      </html>
    `;

    // 6. Send Email
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // Helper function to convert UTF-8 string to Base64 (Chunked to avoid stack overflow)
    const utf8ToBase64 = (str: string): string => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.subarray(i, i + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        return btoa(binary);
      } catch (e) {
        console.error("❌ Base64 encoding error:", e);
        return "";
      }
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FairShare <onboarding@resend.dev>",
        to: [licenseeEmail], // ONLY send to Buyer for now (Resend Test Mode restriction)
        subject: `Dein Lizenzvertrag: ${videoTitle}`,
        html: htmlContent,
        attachments: [
          {
            filename: `Lizenzvertrag_${c.id}.html`,
            content: utf8ToBase64(htmlContent), // Also attach as HTML file
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let resendData;
      try {
        resendData = JSON.parse(errorText);
      } catch {
        resendData = { message: errorText };
      }

      console.error("❌ Resend API Error Response", { errorText });

      // Check for specific 403 error (Sender address not allowed)
      if (
        res.status === 403 ||
        (resendData.message && resendData.message.includes("from address"))
      ) {
        return new Response(
          JSON.stringify({
            error: "Resend Configuration Error",
            message:
              "Email sending failed. If you are using 'onboarding@resend.dev', you can ONLY send to your own email address. Please verify your domain in Resend or update the FROM address.",
            details: resendData,
          }),
          {
            status: 400, // Bad Request (User configuration error)
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Resend API failed: ${res.status} ${errorText}`);
    }

    const resData = await res.json();
    console.log("✅ Email sent successfully", resData);

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Function failed:", error);

    return new Response(
      JSON.stringify({
        error: "Function failed",
        message: errorMsg,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
