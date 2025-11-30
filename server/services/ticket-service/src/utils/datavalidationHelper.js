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
// Helper function to extract text from image/PDF using OCR.space API
const extractTextFromDocument = async (fileBuffer, mimeType) => {
  try {
    // Dynamically import form-data (ES6 style)
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    // Determine file extension
    let fileExtension = 'jpg';
    if (mimeType.includes('pdf')) {
      fileExtension = 'pdf';
    } else if (mimeType.includes('png')) {
      fileExtension = 'png';
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      fileExtension = 'jpg';
    }
    
    // Append file buffer to form
    form.append('file', fileBuffer, {
      filename: `document.${fileExtension}`,
      contentType: mimeType,
    });
    
    // OCR.space free API configuration
    form.append('apikey', 'helloworld'); // Replace with your own API key for production
    form.append('language', 'eng');
    form.append('isOverlayRequired', 'false');
    form.append('detectOrientation', 'true');
    form.append('scale', 'true');
    form.append('OCREngine', '2'); // Engine 2 is better for Indian documents

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      return {
        success: false,
        error: data.ErrorMessage?.[0] || 'OCR processing failed',
      };
    }

    const extractedText = data.ParsedResults?.[0]?.ParsedText || '';
    
    return {
      success: true,
      text: extractedText,
    };
  } catch (error) {
    console.error('Error extracting text from document:', error);
    return {
      success: false,
      error: 'Failed to extract text from document',
    };
  }
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
    // Step 1: Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or PDF image of your Aadhaar card.',
      };
    }

    // Step 2: Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'File too large. Maximum size is 10MB.',
      };
    }

    // Step 3: Extract text from document using OCR
    console.log('Extracting text from Aadhaar card...');
    const ocrResult = await extractTextFromDocument(file.buffer, file.mimetype);
    
    if (!ocrResult.success) {
      return {
        isValid: false,
        error: ocrResult.error || 'Failed to read document. Please upload a clear, high-quality image of your Aadhaar card.',
      };
    }

    console.log('Extracted text length:', ocrResult.text.length);

    // Step 4: Verify the document is actually an Aadhaar card
    console.log('Verifying document is an Aadhaar card...');
    if (!isAadhaarCard(ocrResult.text)) {
      return {
        isValid: false,
        error: 'The uploaded document does not appear to be an Aadhaar card. Please upload a valid Aadhaar card image with visible text including "Aadhaar", UIDAI logo, and your 12-digit Aadhaar number.',
      };
    }

    // Step 5: Extract Aadhaar number from text
    console.log('Extracting Aadhaar number...');
    const aadhaarNumber = extractAadhaarNumber(ocrResult.text);
    
    if (!aadhaarNumber) {
      return {
        isValid: false,
        error: 'Could not find a valid Aadhaar number in the document. Please ensure your Aadhaar card image is clear, well-lit, and the 12-digit number is fully visible.',
      };
    }

    console.log('Found Aadhaar number:', aadhaarNumber.substring(0, 4) + 'XXXX' + aadhaarNumber.substring(8));

    // Step 6: Validate Aadhaar number using API
    console.log('Validating Aadhaar number with UIDAI...');
    const validationResult = await validateAadhaarNumber(aadhaarNumber);
    
    if (!validationResult.isValid) {
      return {
        isValid: false,
        error: validationResult.error + ' Please ensure you have uploaded a valid, government-issued Aadhaar card.',
      };
    }

    console.log('Aadhaar card validated successfully!');
    return {
      isValid: true,
      aadhaarNumber: aadhaarNumber,
      message: 'Aadhaar card verified successfully',
    };
  } catch (error) {
    console.error('Error validating Aadhaar document:', error);
    return {
      isValid: false,
      error: 'Aadhaar verification failed due to a technical error. Please try again or contact support if the issue persists.',
    };
  }
};