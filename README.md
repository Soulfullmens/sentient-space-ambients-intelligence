# SentientSpace 🧠
### A Multimodal Ambient Intelligence Platform

![Gemini 3 Pro](https://img.shields.io/badge/Powered%20by-Gemini%203%20Pro-4285F4?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react)
![Status](https://img.shields.io/badge/Status-Vibe%20Coded-success?style=for-the-badge)

> **"Standard AI assistants wait for you to type. SentientSpace perceives, reasons, and acts on its own."**

SentientSpace is a **multimodal ambient intelligence dashboard** that transforms standard webcams and microphones into intelligent semantic sensors. Built for the Google AI Studio Hackathon, it leverages the **Native Audio** and **Video Reasoning** capabilities of Gemini 3 Pro to solve the "Inference Barrier"—bridging the gap between raw pixel data and real-world safety context.

---

## 🎥 The Concept

Current safety monitoring is binary: "Is there motion?" (Yes/No).
**SentientSpace is semantic:** "Is Alex falling?" "Is Sarah mixing dangerous chemicals?" "Is the client bored?"

It achieves this through a modular "Persona" architecture:
1.  **NeuroSync (Health Mode):** Monitors gait, fall risk, and distress vocalizations for elderly or non-verbal users.
2.  **ChemGuard (Science Mode):** Enforces PPE compliance and simulates chemical reactions before they happen.
3.  **BizVibe (Business Mode):** Analyzes engagement and sentiment during high-stakes video calls.

---

## 🚀 Key Features

### 1. Native Multimodality
Unlike pipeline architectures (Speech-to-Text -> LLM), SentientSpace streams **raw audio waveforms** directly to Gemini. This allows the model to detect:
*   Pain/Distress in a voice (even if words are neutral).
*   Urgency and hesitation.
*   Background environmental sounds (breaking glass, thuds).

### 2. Agentic "Thinking" Mode 🧠
The system employs a two-pass architecture for safety:
*   **Pass 1 (Perception):** Fast, real-time analysis of the video stream.
*   **Pass 2 (Reasoning):** If a high-risk event is detected (Confidence > 0.8), the system enters **"Deep Thinking Mode"**. It pauses to reason through causality before triggering an alert, reducing false positives.
*   **XAI (Explainable AI):** Every alert includes a "Neural Trace"—a transparent log of the model's logic (e.g., *"Visual: Vertical axis change detected + Audio: Silence = Probable Fall"*).

### 3. Privacy Firewall
Built with a "Data Minimalism" philosophy:
*   Video frames are processed in ephemeral RAM and never stored.
*   System prompts explicitly forbid facial recognition or identity tracking.
*   Output is strictly semantic (Status codes, Safety alerts).

---

## 🛠️ Architecture

*   **Frontend:** React 19 + Vite + Tailwind CSS (Glassmorphism UI).
*   **AI Core:** Google GenAI SDK (`@google/genai`).
*   **Model:** `gemini-3-pro-preview`.
*   **Audio:** Web Audio API (Raw PCM streaming & VAD).
*   **Video:** Adaptive Frame Sampling (Canvas API).

---

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YOUR_USERNAME/sentient-space-gemini.git
    cd sentient-space-gemini
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  **Run the application**
    ```bash
    npm start
    ```

---

## 🧪 Simulation & Testing

The app includes a built-in **Simulator** for judges and developers to test specific scenarios without needing to stage physical accidents.

Open the Browser Console (`F12`) and run:

```javascript
// Simulate a Fall Event (Health Mode)
window.sentientSimulate.danger()

// Simulate a PPE Warning (Science Mode)
window.sentientSimulate.warn()

// Simulate a Safe State
window.sentientSimulate.safe()
```

---

## 🏆 Hackathon Tracks

*   **Overall:** Demonstrates "White Space" innovation in Native Multimodality.
*   **Health:** "NeuroSync" persona for remote patient monitoring.
*   **Science:** "ChemGuard" persona for remote STEM safety.
*   **Business:** "BizVibe" persona for sales enablement.

---

*Built with ❤️ using Vibe Coding.*
