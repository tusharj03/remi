export const analyzeWithRork = async (base64Image, lesson, audioContext = null) => {
    const isPosture = lesson.type === 'posture';

    // Prompt Engineering
    const role = "You are a strict, perfectionist guitar instructor. You do not accept sloppy technique.";

    const fingerReqs = lesson.chordData
        ? lesson.chordData.fingers.map(f => `- Finger ${f.finger} on String ${f.string}, Fret ${f.fret}`).join('\n')
        : "Standard playing position.";

    const noteReqs = lesson.requiredNotes
        ? `Required Notes: ${lesson.requiredNotes.join(', ')}`
        : (lesson.targetNote ? `Target Note: ${lesson.targetNote}` : "");

    const criteria = isPosture
        ? `Check compliance with: "${lesson.briefing}". Key points: ${lesson.prompts.join(', ')}.`
        : `Target Chord: ${lesson.title}.\nMANDATORY FINGER POSITIONS:\n${fingerReqs}`;

    // [NEW] Audio Context Injection
    const audioContextStr = audioContext
        ? `AUDIO ANALYSIS: The system heard: ${JSON.stringify(audioContext)}.
           ${noteReqs ? `COMPARE heard notes with ${noteReqs}.` : ""}
           
           LOGIC CHECK:
           - If Visual is PERFECT but Audio is WRONG -> FAIL (Feedback: "Press harder, buzzing/wrong notes")
           - If Audio is PERFECT but Visual is WRONG -> FAIL (Feedback: "Fix your hand shape")
           - If Visual is "okay" but not perfect -> FAIL (Feedback: "Be precise. Finger X is wrong.")`
        : "";

    const systemPrompt = `${role} 
    TASK: Verify student technique for lesson: "${lesson.title}". 
    ${criteria}
    ${lesson.referenceImage ? "COMPARE student's hand (second image) with the REFERENCE (first image)." : ""}
    ${audioContextStr}
    
    RESPONSE RULES:
    1. **CRITICAL PRE-CHECK**: Look for a **Guitar Neck** and a **Human Hand**. IF MISSING -> FAIL.
    2. **STRICT VISUAL CHECK**: 
       - Do the fingers EXACTLY match the mandatory positions? 
       - If ANY finger is on the wrong string or fret -> FAIL.
       - If the hand is "all over the place" -> FAIL.
       - If the fingers are not clearly on the correct frets, FAIL.
    3. **AUDIO SYNC**: Does the audio match the chord? If not -> FAIL.
    
    Only set "success": true if the technique is TEXTBOOK PERFECT.
    
    Construct "feedback" using strictly this format:
    "[Correction: what is wrong]. [Action: one concrete physical step]. [Brief encouragement: max 4 words]."

    Respond STRICTLY JSON: { "success": boolean, "confidence": number, "feedback": "string" }`;


    try {
        let userContent = [{ type: 'text', text: "Critique this." }, { type: 'image', image: base64Image }];

        if (lesson.referenceImage) {
            try {
                // Fetch image (client side fetch relative to public)
                const refRes = await fetch(lesson.referenceImage);
                const refBlob = await refRes.blob();

                // Convert blob to base64
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onloadend = resolve;
                    reader.onerror = reject;
                    reader.readAsDataURL(refBlob);
                });

                // reader.result is "data:image/jpeg;base64,..."
                const refBase64 = reader.result.split(',')[1];

                // Prepend reference image
                userContent.unshift({ type: 'image', image: refBase64 });

            } catch (err) {
                console.warn("Failed to load reference image for AI:", err);
            }
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];

        const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();

        let content = data.completion || "{}";
        // Sanitize
        if (content.includes('```')) {
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        return JSON.parse(content);
    } catch (e) {
        console.error("Vision Analysis Failed", e);
        return null;
    }
};

export const findGuitarNeck = async (base64Image) => {
    // Prompt for spatial analysis - EMPHASIZE PRECISE LANDMARKS
    const systemPrompt = `You are a computer vision engine. TASK: Precise Guitar Fretboard Alignment.
    Locate the visual bounds of the guitar strings/fretboard.
    1. "start": The Nut (where strings leave the headstock).
    2. "end": The highest visible fret or body joint.
    Return JSON: { 
        "found": boolean,
        "start_x": number, "start_y": number, // center of nut
        "end_x": number, "end_y": number,     // center of body joint
        "start_width": number, // neck width at nut
        "end_width": number    // neck width at body joint
    }
    If unsure, return found: false.`;

    try {
        const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: [{ type: 'image', image: base64Image }] }
                ]
            })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        let content = data.completion || "{}";
        if (content.includes('```')) {
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        return JSON.parse(content);
    } catch (e) {
        console.error("Neck Detection Failed", e);
        return { found: false };
    }
};
