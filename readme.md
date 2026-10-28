## 🔒 Steganography - Web GUI

## 🚀 Features

* **Multi-Format Input**: Supports uploading **PNG**, **BMP**, **WebP**, and **JPEG** images for hiding or extracting secret messages.

* **RGB Bitwise Embedding**: Conceals text directly inside the **Least Significant Bits (LSB)** of Red, Green, and Blue pixel channels.

* **Lossless PNG Export**: Automatically encodes and triggers a one-click download of `encoded_secret.png` to preserve modified pixel bits without compression loss.

* **Signature Verification**: Uses a built-in `STEG:` prefix and null-byte terminator (`\0`) to reliably detect and extract hidden payloads entirely client-side.

## 📁 Project Structure

```
PixelCrypt
├── index.html   # Layout, file/text inputs
├── style.css    # Styling and button/box themes
└── script.js    # Encoding, decoding, and validation logic
  

```

## 📥 Installation & Setup

Follow these steps to run and use the application locally in your browser:

1. **Download/Prepare Files**: Create a folder named `PixelCrypt` on your computer and place `index.html`, `style.css`, and `script.js` inside it.

2. **Launch the Application**:
   Double-click `index.html` to open directly in browser.

3. **Select an Input Image**:
   Click the **Select Input Image** button and choose a image file from computer.

4. **Embed & Save Secret Text**:
   Type your  message into the **Enter Text...** box and click **Embed & Save** to download the encoded image as `encoded_secret.png`.

5. **Extract Hidden Text**:
   Click **Select Input Image** to load `encoded_secret.png`, then click **Extract Text** to display the decoded message inside the **Output Box**.