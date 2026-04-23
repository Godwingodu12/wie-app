import fetch from 'node-fetch';
export const validateIFSCCode = async (ifscCode) => {
  try {
    if (!ifscCode || typeof ifscCode !== 'string') {
      return {
        isValid: false,
        error: 'IFSC code is required',
      };
    }

    const cleanedCode = ifscCode.trim().toUpperCase();

    if (cleanedCode.length !== 11) {
      return {
        isValid: false,
        error: `Invalid IFSC code format. Must be exactly 11 characters (you entered ${cleanedCode.length} characters). Example: SBIN0001234`,
      };
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(cleanedCode)) {
      let formatError = 'Invalid IFSC code format. ';
      if (!/^[A-Z]{4}/.test(cleanedCode)) {
        formatError += 'First 4 characters must be letters (bank code). ';
      }
      if (cleanedCode.charAt(4) !== '0') {
        formatError += 'Fifth character must be 0 (zero). ';
      }
      if (!/^[A-Z0-9]{6}$/.test(cleanedCode.substring(5))) {
        formatError += 'Last 6 characters must be letters or numbers (branch code). ';
      }
      formatError += 'Example format: SBIN0001234';
      return {
        isValid: false,
        error: formatError,
      };
    }
    // Use Razorpay's free IFSC API (no key required)
    const response = await fetch(`https://ifsc.razorpay.com/${cleanedCode}`);
    if (response.status === 200) {
      const data = await response.json();
      return {
        isValid: true,
        bankDetails: {
          bank: data.BANK,
          branch: data.BRANCH,
          address: data.ADDRESS,
          city: data.CITY,
          state: data.STATE,
          ifsc: data.IFSC,
        },
      };
    } else if (response.status === 404) {
      return {
        isValid: false,
        error: `The IFSC code "${cleanedCode}" does not exist in the bank database. Please verify your IFSC code from your bank passbook or cheque book.`,
      };
    } else {
      console.error('IFSC API error:', response.status);
      return {
        isValid: false,
        error: 'Unable to validate IFSC code at this time. Please try again later.',
      };
    }
  } catch (error) {
    console.error('Error validating IFSC code:', error);
    return {
      isValid: false,
      error: 'IFSC validation failed due to network error. Please check your connection and try again.',
    };
  }
};

// ── Local OCR fallback using Tesseract.js (no external API needed) ───────────
const extractTextLocally = async (fileBuffer) => {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    // Pass buffer directly — Tesseract.js accepts Buffer
    const { data: { text } } = await worker.recognize(fileBuffer);
    await worker.terminate();
    console.log('Local OCR (Tesseract) extracted text length:', text.length);
    return { success: true, text };
  } catch (err) {
    console.error('Local OCR (Tesseract) failed:', err.message);
    return { success: false, error: 'Local OCR failed: ' + err.message };
  }
};

// Helper function to extract text from image/PDF using OCR.space API
// Falls back to local Tesseract.js if the remote API is unavailable
const extractTextFromDocument = async (fileBuffer, mimeType) => {
  // ── Attempt 1: OCR.space via base64
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';

    let base64Prefix = 'data:image/jpeg;base64,';
    if (mimeType.includes('pdf'))        base64Prefix = 'data:application/pdf;base64,';
    else if (mimeType.includes('png'))   base64Prefix = 'data:image/png;base64,';

    const base64Image = base64Prefix + fileBuffer.toString('base64');

    const params = new URLSearchParams();
    params.append('apikey',            apiKey);
    params.append('base64Image',       base64Image);
    params.append('language',          'eng');
    params.append('isOverlayRequired', 'false');
    params.append('detectOrientation', 'true');
    params.append('scale',             'true');
    params.append('OCREngine',         '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
      // Timeout after 15 s so we don't hang the request
      signal:  AbortSignal.timeout(15000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();

      if (!data.IsErroredOnProcessing) {
        const extractedText = data.ParsedResults?.[0]?.ParsedText || '';
        if (extractedText.trim().length > 0) {
          console.log('OCR.space extracted text length:', extractedText.length);
          return { success: true, text: extractedText };
        }
        console.warn('OCR.space returned empty text — switching to local OCR.');
      } else {
        console.warn('OCR.space processing error:', data.ErrorMessage);
      }
    } else {
      console.warn('OCR.space returned non-JSON (status', response.status, ') — switching to local OCR.');
    }
  } catch (remoteErr) {
    console.warn('OCR.space request failed:', remoteErr.message, '— switching to local OCR.');
  }
  // ── Attempt 2: Tesseract.js (fully local, no API key needed) 
  console.log('Running local OCR (Tesseract.js)...');
  return extractTextLocally(fileBuffer);
};

// Helper function to verify if document is an Aadhaar card
const isAadhaarCard = (text) => {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Keywords that MUST appear in an Aadhaar card
  const aadhaarKeywords = [
    'aadhaar',
    'aadhar',
    'आधार',
    'uidai',
    'government of india',
    'भारत सरकार'
  ];
  
  // Check if at least one Aadhaar keyword is present
  const hasAadhaarKeyword = aadhaarKeywords.some(keyword => lowerText.includes(keyword));
  
  if (!hasAadhaarKeyword) {
    return false;
  }
  
  // Additional verification: Look for typical Aadhaar card elements
  const hasDateOfBirth = /(?:dob|date of birth|जन्म तिथि)/i.test(text);
  const hasGender = /(?:male|female|पुरुष|महिला)/i.test(text);
  const has12DigitNumber = /\d{4}\s*\d{4}\s*\d{4}/.test(text) || /\d{12}/.test(text);
  
  // An Aadhaar card should have at least 2 of these 3 elements plus the keyword
  const verificationCount = [hasDateOfBirth, hasGender, has12DigitNumber].filter(Boolean).length;
  
  return verificationCount >= 2;
};

// Helper function to extract Aadhaar number from text
const extractAadhaarNumber = (text) => {
  // Remove all whitespace and newlines for continuous digit search
  const cleanText = text.replace(/\s+/g, '');
  
  // Pattern 1: 12 continuous digits
  const pattern1 = /\d{12}/g;
  
  // Pattern 2: Aadhaar format with spaces (XXXX XXXX XXXX)
  const pattern2 = /\d{4}\s+\d{4}\s+\d{4}/g;
  
  // Try pattern 2 first (with spaces) - more reliable for Aadhaar cards
  const matches2 = text.match(pattern2);
  if (matches2 && matches2.length > 0) {
    // Find the first match that doesn't start with 0 or 1
    for (const match of matches2) {
      const cleanedNumber = match.replace(/\s+/g, '');
      const firstDigit = cleanedNumber.charAt(0);
      if (firstDigit !== '0' && firstDigit !== '1') {
        return cleanedNumber;
      }
    }
  }
  
  // Try pattern 1 (continuous) as fallback
  const matches1 = cleanText.match(pattern1);
  if (matches1 && matches1.length > 0) {
    // Filter out numbers that are unlikely to be Aadhaar
    // Aadhaar numbers don't start with 0 or 1
    const validMatches = matches1.filter(num => {
      const firstDigit = num.charAt(0);
      return firstDigit !== '0' && firstDigit !== '1';
    });
    
    if (validMatches.length > 0) {
      return validMatches[0]; // Return first valid match
    }
  }
  
  return null;
};
// Add Verhoeff algorithm for Aadhaar checksum validation
const verhoeffValidate = (num) => {
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  let c = 0;
  const myArray = num.split('').reverse();

  for (let i = 0; i < myArray.length; i++) {
    c = d[c][p[i % 8][parseInt(myArray[i], 10)]];
  }

  return c === 0;
};
// // Helper function to validate Aadhaar number using ApyHub API
// const validateAadhaarNumber = async (aadhaarNumber) => {
//   try {
//     if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
//       return {
//         isValid: false,
//         error: 'Invalid Aadhaar number format. Must be 12 digits.',
//       };
//     }

//     // Aadhaar numbers cannot start with 0 or 1
//     if (aadhaarNumber.charAt(0) === '0' || aadhaarNumber.charAt(0) === '1') {
//       return {
//         isValid: false,
//         error: 'Invalid Aadhaar number. Cannot start with 0 or 1.',
//       };
//     }

//     // Call ApyHub Aadhaar Validation API
//     const response = await fetch('https://api.apyhub.com/validate/aadhaar', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'apy-token': process.env.AADHAR_API_KEY,
//       },
//       body: JSON.stringify({
//         aadhaar: aadhaarNumber,
//       }),
//     });

//     const data = await response.json();

//     if (response.status === 200) {
//       if (data.data === false) {
//         return {
//           isValid: false,
//           error: 'Aadhaar number is invalid or does not exist',
//         };
//       }

//       return {
//         isValid: true,
//         aadhaarNumber: aadhaarNumber,
//       };
//     } else if (response.status === 400) {
//       return {
//         isValid: false,
//         error: 'Invalid Aadhaar number format',
//       };
//     } else if (response.status === 401) {
//       console.error('Aadhaar API authentication failed');
//       return {
//         isValid: false,
//         error: 'Aadhaar validation service unavailable',
//       };
//     } else {
//       console.error('Aadhaar API error:', data);
//       return {
//         isValid: false,
//         error: 'Unable to validate Aadhaar number at this time',
//       };
//     }
//   } catch (error) {
//     console.error('Error validating Aadhaar number:', error);
//     return {
//       isValid: false,
//       error: 'Aadhaar validation failed. Please try again.',
//     };
//   }
// };
const validateAadhaarNumber = async (aadhaarNumber) => {
  try {
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return {
        isValid: false,
        error: 'Invalid Aadhaar number format. Must be 12 digits.',
      };
    }
    if (aadhaarNumber.charAt(0) === '0' || aadhaarNumber.charAt(0) === '1') {
      return {
        isValid: false,
        error: 'Invalid Aadhaar number. Cannot start with 0 or 1.',
      };
    }
    // Verhoeff algorithm validation (checksum validation for Aadhaar)
    if (!verhoeffValidate(aadhaarNumber)) {
      return {
        isValid: false,
        error: 'Invalid Aadhaar number. Checksum validation failed.',
      };
    }
    // If all checks pass, accept the Aadhaar number
    return {
      isValid: true,
      aadhaarNumber: aadhaarNumber,
    };
  } catch (error) {
    console.error('Error validating Aadhaar number:', error);
    return {
      isValid: false,
      error: 'Aadhaar validation failed. Please try again.',
    };
  }
};
// Main function to validate Aadhaar document
export const validateAadhaarDocument = async (file) => {
  try {
    // ── Step 1: File type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or PDF image of your Aadhaar card.',
      };
    }

    // ── Step 2: File size (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'File too large. Maximum size is 10 MB.',
      };
    }

    // ── Step 3: Buffer present
    if (!file.buffer || file.buffer.length === 0) {
      return {
        isValid: false,
        error: 'File appears to be empty. Please re-upload your Aadhaar card.',
      };
    }

    console.log('Extracting text from Aadhaar card...');

    // ── Step 4: OCR (remote + local fallback)
    const ocrResult = await extractTextFromDocument(file.buffer, file.mimetype);

    if (!ocrResult.success || !ocrResult.text?.trim()) {
      // Both remote and local OCR failed — this is a genuine infrastructure problem
      console.error('Both OCR methods failed:', ocrResult.error);
      return {
        isValid: false,
        error:
          'Could not read text from your document. Please upload a clear, ' +
          'well-lit photo of your Aadhaar card (JPEG or PNG preferred, max 10 MB).',
      };
    }

    console.log('Extracted text length:', ocrResult.text.length);
    // Uncomment the line below during debugging to see what OCR reads
    // console.log('OCR raw text:', ocrResult.text);

    // ── Step 5: Confirm it is an Aadhaar card
    console.log('Verifying document is an Aadhaar card...');
    if (!isAadhaarCard(ocrResult.text)) {
      return {
        isValid: false,
        error:
          'The uploaded document does not appear to be an Aadhaar card. ' +
          'Please upload a valid Aadhaar card that clearly shows the word ' +
          '"Aadhaar" / "आधार" and your 12-digit Aadhaar number.',
      };
    }

    // ── Step 6: Extract 12-digit number
    console.log('Extracting Aadhaar number...');
    const aadhaarNumber = extractAadhaarNumber(ocrResult.text);

    if (!aadhaarNumber) {
      return {
        isValid: false,
        error:
          'Could not locate your 12-digit Aadhaar number in the image. ' +
          'Please ensure the number is fully visible and not covered or cropped.',
      };
    }

    console.log(
      'Found Aadhaar number:',
      aadhaarNumber.substring(0, 4) + ' XXXX ' + aadhaarNumber.substring(8)
    );

    // ── Step 7: Verhoeff checksum
    console.log('Validating Aadhaar number checksum...');
    const validationResult = await validateAadhaarNumber(aadhaarNumber);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        error:
          'The Aadhaar number in the image did not pass checksum validation. ' +
          'This can happen if the image is blurry or partially cropped. ' +
          'Please upload a sharper, uncropped photo of your Aadhaar card. ' +
          `(Detail: ${validationResult.error})`,
      };
    }

    console.log('Aadhaar card validated successfully!');
    return {
      isValid:      true,
      aadhaarNumber,
      message:      'Aadhaar card verified successfully.',
    };

  } catch (error) {
    console.error('Unexpected error in validateAadhaarDocument:', error);
    return {
      isValid: false,
      error:
        'Aadhaar verification encountered an unexpected error. ' +
        'Please try again. If the issue persists, contact support.',
    };
  }
};
