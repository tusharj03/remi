export const analyzeWithRork = async (base64Image, lesson) => {
    const isPosture = lesson.type === 'posture';

    // Prompt Engineering
    const role = "You are a strict, efficient guitar instructor. Your goal is rapid improvement.";

    const criteria = isPosture
        ? "Check hand shape. Thumb must be behind the neck. Fingers must be arched. Identify the single most critical error."
        : (lesson.chordData
            ? `Target Chord: ${lesson.chordData.name}. Required Fingers: ${lesson.chordData.fingers.map(f => `String ${f.string} Fret ${f.fret}`).join(', ')}. Check finger placement. Identify the single most critical error.`
            : `Check finger placement for ${lesson.title}. Identify the single most critical error.`);

    const systemPrompt = `${role} 
    TASK: Verify student technique for lesson: "${lesson.title}". ${criteria}.
    
    RESPONSE RULES:
    1. If technique is correct (or close enough for a beginner), set "success": true.
    2. If incorrect, identify ONE single mistake.
    3. Construct "feedback" using strictly this format:
       "[Correction: what is wrong]. [Action: one concrete physical step]. [Brief encouragement: max 4 words]."
       
    EXAMPLE FEEDBACK:
    "Thumb is too high. Drop your wrist to arch fingers. Try again."
    "Index finger is flat. Curl the knuckle to clear strings. Fix that."
    
    Respond STRICTLY JSON: { "success": boolean, "confidence": number, "feedback": "string" }`;

    try {
        const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: [{ type: 'text', text: "Critique this." }, { type: 'image', image: base64Image }] }
                ]
            })
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
