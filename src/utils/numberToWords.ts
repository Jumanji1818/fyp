// Converts currency numbers to words for formal enterprise contracts and award letters

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ONES[num];
  if (num < 100) {
    const ten = TENS[Math.floor(num / 10)];
    const one = ONES[num % 10];
    return one ? `${ten}-${one}` : ten;
  }
  const hundred = `${ONES[Math.floor(num / 100)]} Hundred`;
  const remainder = num % 100;
  if (remainder === 0) return hundred;
  return `${hundred} and ${convertLessThanThousand(remainder)}`;
}

export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero';
  
  const absoluteAmount = Math.abs(amount);
  const wholePart = Math.floor(absoluteAmount);
  const decimalPart = Math.round((absoluteAmount - wholePart) * 100);

  if (wholePart === 0 && decimalPart === 0) return 'Zero';

  const chunks: { value: number; unit: string }[] = [
    { value: 1_000_000_000_000, unit: 'Trillion' },
    { value: 1_000_000_000, unit: 'Billion' },
    { value: 1_000_000, unit: 'Million' },
    { value: 1_000, unit: 'Thousand' },
    { value: 1, unit: '' },
  ];

  let current = wholePart;
  const words: string[] = [];

  for (const chunk of chunks) {
    if (current >= chunk.value) {
      const chunkCount = Math.floor(current / chunk.value);
      current = current % chunk.value;
      const chunkWords = convertLessThanThousand(chunkCount);
      if (chunkWords) {
        words.push(chunk.unit ? `${chunkWords} ${chunk.unit}` : chunkWords);
      }
    }
  }

  return words.join(', ').trim();
}

export function nairaAmountToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Naira Only';

  const whole = Math.floor(Math.abs(amount));
  const kobo = Math.round((Math.abs(amount) - whole) * 100);

  const nairaText = numberToWords(whole);
  let result = `${nairaText} Naira`;

  if (kobo > 0) {
    const koboText = numberToWords(kobo);
    result += ` and ${koboText} Kobo`;
  }

  result += ' Only';
  return result;
}
