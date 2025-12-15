export const sendMessageToAI = async (message) => {
    try {
        const systemPrompt = `You are Remi, an expert guitar tutor AI. 
        Your goal is to help users learn guitar, understand chords, tuning, and techniques.
        Keep your answers concise (max 2-3 sentences unless asked for detail).
        Be encouraging and helpful.
        Format constraints:
        - Use "double asterisks" for **bold** text to emphasize key terms (e.g. **Index Finger**).
        - If the user asks for a specific chord diagram (e.g. "show me G major", "how to play Em"), include a special tag at the VERY END of your response EXACTLY like this: [show_chord: chord_id].
        - IDs to use: c_major, a_major, g_major, e_major, d_major, am, em, dm.
        - Example: "Here is the C Major chord." [show_chord: c_major]
        
        User Query: ${message}`;

        const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: [{ type: 'text', text: message }] }
                ]
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        let text = data.completion || "I'm having trouble thinking right now.";

        // Clean up any markdown json wrapping if it occurs (though strict text mode usually avoids it)
        if (text.includes('```')) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        return text;

    } catch (error) {
        console.error("AI Chat Error:", error);
        return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
