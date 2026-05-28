const HOROSCOPE: Array<[number, number, number, number, string]> = [
    [3, 21, 4, 19, 'Aries'],
    [4, 20, 5, 20, 'Taurus'],
    [5, 21, 6, 20, 'Gemini'],
    [6, 21, 7, 22, 'Cancer'],
    [7, 23, 8, 22, 'Leo'],
    [8, 23, 9, 22, 'Virgo'],
    [9, 23, 10, 22, 'Libra'],
    [10, 23, 11, 21, 'Scorpio'],
    [11, 22, 12, 21, 'Sagittarius'],
    [12, 22, 1, 19, 'Capricorn'],
    [1, 20, 2, 18, 'Aquarius'],
    [2, 19, 3, 20, 'Pisces'],
];

export function getHoroscope(date: Date): string {
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    for (const [sm, sd, em, ed, sign] of HOROSCOPE) {
        if (sm === em) {
            if (m === sm && d >= sd && d <= ed) return sign;
        } else if ((m === sm && d >= sd) || (m === em && d <= ed)) {
            return sign;
        }
    }
    return 'Unknown';
}

const ZODIAC = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
    'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

export function getZodiac(date: Date): string {
    const year = date.getUTCFullYear();
    const index = ((year - 2020) % 12 + 12) % 12;
    return ZODIAC[index];
}