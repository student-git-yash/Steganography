const fileInput = document.getElementById('fileInput');
const secretInput = document.getElementById('secretInput');
const embedBtn = document.getElementById('embedBtn');
const extractBtn = document.getElementById('extractBtn');
const outputBox = document.getElementById('outputBox');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let loadedImage = null;
const SIGNATURE = "STEG:";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB limit
const MAX_DIMENSION = 8192;             // Max 8192x8192 px against decompression bombs
const MAX_MESSAGE_LENGTH = 10000;       // Max characters to prevent UI lockup
const ALLOWED_TYPES = ['image/png', 'image/bmp', 'image/webp', 'image/jpeg'];

function setStatus(message, color = '#ffffff') {
  outputBox.style.color = color;
  outputBox.textContent = message;
}

// Allow re-selecting the exact same file
fileInput.addEventListener('click', () => {
  fileInput.value = '';
});

// 1. Handle Image Selection
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    loadedImage = null;
    return;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    loadedImage = null;
    setStatus('Error: Unsupported File Format!', '#ff0d00');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    loadedImage = null;
    setStatus('Error: Image Exceeds 20MB Limit!', '#ff0d00');
    return;
  }

  const reader = new FileReader();

  reader.onerror = () => {
    loadedImage = null;
    setStatus('Error: Failed To Read File!', '#ff0d00');
  };

  reader.onload = (event) => {
    const img = new Image();

    img.onerror = () => {
      loadedImage = null;
      setStatus('Error: Corrupted Or Invalid Image!', '#ff0d00');
    };

    img.onload = () => {
      if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION || img.width === 0 || img.height === 0) {
        loadedImage = null;
        setStatus(`Error: Image Dimensions Must Be Under ${MAX_DIMENSION}px!`, '#ff0d00');
        return;
      }

      loadedImage = img;
      canvas.width = img.width;
      canvas.height = img.height;
      setStatus('Image Uploaded Successfully', '#ffffff');
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

// 2. Embed Secret Text into RGB LSBs
embedBtn.addEventListener('click', () => {
  if (!loadedImage) {
    setStatus('Select An Input Image First!', '#ff0d00');
    return;
  }

  const rawText = secretInput.value.trim();
  if (!rawText) {
    setStatus('Enter Text To Embed!', '#ff0d00');
    return;
  }

  if (rawText.length > MAX_MESSAGE_LENGTH) {
    setStatus(`Error: Text Exceeds ${MAX_MESSAGE_LENGTH} Characters!`, '#ff0d00');
    return;
  }

  // Validate: Allow ONLY letters (A-Z, a-z), numbers (0-9), and spaces
  const alphanumericRegex = /^[A-Za-z0-9 ]+$/;
  if (!alphanumericRegex.test(rawText)) {
    setStatus('Error: Only Letters And Numbers Are Allowed!', '#ff0d00');
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(loadedImage, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const fullMessage = SIGNATURE + rawText + '\0';
  const requiredBits = fullMessage.length * 8;
  const availableChannels = (data.length / 4) * 3;

  if (requiredBits > availableChannels) {
    setStatus('Error: Message Is Too Long For This Image.', '#ff0d00');
    return;
  }

  let dataIdx = 0;
  for (let i = 0; i < fullMessage.length; i++) {
    const charCode = fullMessage.charCodeAt(i) & 0xFF;

    for (let bit = 7; bit >= 0; bit--) {
      // Skip Alpha channel
      if (dataIdx % 4 === 3) {
        dataIdx++;
      }

      // Force current pixel's Alpha channel to 255 to prevent premultiplied alpha corruption
      const alphaIdx = dataIdx - (dataIdx % 4) + 3;
      data[alphaIdx] = 255;

      const bitVal = (charCode >> bit) & 1;
      data[dataIdx] = (data[dataIdx] & 0xFE) | bitVal;
      dataIdx++;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Sync loadedImage with the newly encoded canvas data
  const encodedDataUrl = canvas.toDataURL('image/png');
  const updatedImg = new Image();
  updatedImg.onload = () => {
    loadedImage = updatedImg;
  };
  updatedImg.src = encodedDataUrl;

  // Trigger download of the modified PNG image
  const link = document.createElement('a');
  link.download = 'encoded_secret.png';
  link.href = encodedDataUrl;
  link.click();

  setStatus('Encoded Image Downloaded', '#30d158');
  secretInput.value = '';
});

// 3. Extract Secret Text from RGB LSBs
extractBtn.addEventListener('click', () => {
  if (!loadedImage) {
    setStatus('Select An Image First!', '#ff0d00');
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(loadedImage, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let dataIdx = 0;
  let extracted = '';
  const maxExtractChars = SIGNATURE.length + MAX_MESSAGE_LENGTH;

  // 8 bits across RGBA requires up to 11 array indices
  while (dataIdx + 11 <= data.length && extracted.length <= maxExtractChars) {
    let charCode = 0;

    for (let bit = 7; bit >= 0; bit--) {
      if (dataIdx % 4 === 3) dataIdx++;
      const lsb = data[dataIdx] & 1;
      charCode = (charCode << 1) | lsb;
      dataIdx++;
    }

    if (charCode === 0) break;
    extracted += String.fromCharCode(charCode);

    // Early exit if the signature doesn't match
    if (extracted.length === SIGNATURE.length && extracted !== SIGNATURE) {
      setStatus('No Message Found', '#ff9f0a');
      return;
    }
  }

  if (extracted.startsWith(SIGNATURE)) {
    const secret = extracted.slice(SIGNATURE.length);
    setStatus(`Extracted: "${secret}"`, '#30d158');
  } else {
    setStatus('No Message Found', '#ff9f0a');
  }
});