
// Mock logic of updateUserProgress to test pure function parts

const testLogic = (currentProgress, lessonId, mockDateStr) => {
    // 1. Deduplicate Lesson
    const oldCompleted = currentProgress?.completedLessons || [];
    const completedLessons = oldCompleted.includes(lessonId)
        ? oldCompleted
        : [...oldCompleted, lessonId];

    // 2. Streak Calculation (Timezone Naive / Client Time)
    // Mocking "now"
    const now = mockDateStr ? new Date(mockDateStr) : new Date();
    const todayStr = now.toISOString().split('T')[0];

    let newStreak = currentProgress?.streak || 0;
    // Allow mocking lastLessonDate for test
    const lastDateStr = currentProgress?.lastLessonDate;

    if (lastDateStr !== todayStr) {
        if (lastDateStr) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDateStr === yesterdayStr) {
                // Consecutive day
                newStreak += 1;
                console.log(`[Streak] Incrementing: ${lastDateStr} -> ${todayStr}`);
            } else {
                // Break in streak, reset to 1
                newStreak = 1;
                console.log(`[Streak] Resetting: ${lastDateStr} -> ${todayStr}`);
            }
        } else {
            // First time ever
            newStreak = 1;
            console.log(`[Streak] New User: -> ${todayStr}`);
        }
    } else {
        console.log(`[Streak] Same Day: ${lastDateStr} == ${todayStr}`);
    }

    return { completedLessons, streak: newStreak, lastLessonDate: todayStr };
}

// TESTS
console.log("--- RUNNING TESTS ---");

// Test 1: New User
const t1 = testLogic({}, 'lesson1', '2025-01-01');
if (t1.streak === 1) console.log("PASS: New User Streak 1");
else console.error("FAIL: New User Streak", t1);

// Test 2: Next Day (Streak Increment)
const t2 = testLogic({ streak: 1, lastLessonDate: '2025-01-01', completedLessons: ['lesson1'] }, 'lesson2', '2025-01-02');
if (t2.streak === 2) console.log("PASS: Increment Streak");
else console.error("FAIL: Increment Streak", t2);

// Test 3: Same Day (No Change)
const t3 = testLogic({ streak: 2, lastLessonDate: '2025-01-02', completedLessons: ['lesson1', 'lesson2'] }, 'lesson3', '2025-01-02');
if (t3.streak === 2) console.log("PASS: Same Day Steak");
else console.error("FAIL: Same Day Streak", t3);

// Test 4: Skip Day (Reset)
const t4 = testLogic({ streak: 2, lastLessonDate: '2025-01-02', completedLessons: [] }, 'lesson3', '2025-01-04');
if (t4.streak === 1) console.log("PASS: Reset Streak");
else console.error("FAIL: Reset Streak", t4);

// Test 5: Deduplication
const t5 = testLogic({ completedLessons: ['lessonA'] }, 'lessonA', '2025-01-01');
if (t5.completedLessons.length === 1) console.log("PASS: Deduplication");
else console.error("FAIL: Deduplication", t5);

console.log("--- DONE ---");
