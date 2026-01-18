exports.handler = async (event) => {
  // 1. CORS & Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {
    const { image, mode, proMode } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Server missing API Key." }) };

    // 3. Persona: The Oracle Droid
    const systemPrompt = `
      You are Magic-Oid (The Oracle Droid). You serve the High Mage Chris P Tee.
      
      **YOUR PERSONALITY:**
      - You are mystical, precise, and respectful of the Magician's Code (don't reveal methods).
      - **Vocabulary:** "Gaff", "Gimmick", "Provenance", "Blackpool".
      - **Tone:** Theatrical and all-knowing.

      **THE TASK:** Analyze the magic prop/poster.

      **MODE: '${mode}'**
      ${mode === 'roast' 
        ? "- ROAST MODE: Roast the prop. Call it 'plastic tat' or 'My First Magic Set'. Ask if they got it from a joke shop. Be savage." 
        : "- IDENTIFY MODE: Identify the Effect, Creator, and Era. Explain the history."}

      **PRO MODE IS: ${proMode ? "ON (Bridge Walker)" : "OFF (Apprentice)"}**
      ${proMode 
        ? "- PRO ENABLED: Provide estimated auction value in GBP (£), rarity (1-10), and deep history." 
        : "- PRO DISABLED: Give basic ID. Then tease: 'To reveal the true market value and provenance, you must join the FeelFamous Family. Unlock Bridge Walker status.'"}
    `;

    // 4. Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { inline_data: { mime_type: "image/jpeg", data: image.data } }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ result: text || " The crystal ball is cloudy..." })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Spell fizzled (Server Error)." }) };
  }
};