export const analyzeWithRork = async (base64Image, lesson) => {
    const isPosture = lesson.type === 'posture';

    // Prompt Engineering
    const role = isPosture
        ? "You are Remi, a supportive guitar coach."
        : "You are Remi, a strict guitar examiner.";

    const criteria = isPosture
        ? "Check hand shape. Thumb should be behind the neck. Fingers should be arched. If mostly correct, MARK SUCCESS."
        : (lesson.chordData
            ? `Target Chord: ${lesson.chordData.name}. Required Fingers: ${lesson.chordData.fingers.map(f => `String ${f.string} Fret ${f.fret}`).join(', ')}. Verify ALL fingers are placed correctly. if clearly wrong, FAIL.`
            : `Check finger placement for ${lesson.title}. Are they on the correct strings? If clearly wrong, FAIL. If plausible, PASS.`);

    const systemPrompt = `${role} TASK: Verify student technique for lesson: "${lesson.title}". ${criteria}. Respond STRICTLY JSON: { "success": boolean, "confidence": number, "feedback": "string" }`;

    try {
        const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: [{ type: 'text', text: "Verify this." }, { type: 'image', image: base64Image }] }
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
