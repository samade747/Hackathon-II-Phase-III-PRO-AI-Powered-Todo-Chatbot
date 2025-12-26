"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import "regenerator-runtime/runtime";

export default function VoiceControl({ onTranscript }: { onTranscript: (t: string) => void }) {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // Auto-send or update parent when transcript changes could be tricky if continuous.
    // Instead, we 'commit' the transcript when the user stops listening.

    useEffect(() => {
        if (!listening && transcript) {
            onTranscript(transcript);
            resetTranscript();
        }
    }, [listening, transcript, onTranscript, resetTranscript]);

    if (!browserSupportsSpeechRecognition) {
        return null; // Or return a disabled button with tooltip
    }

    const toggleListening = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                listening
                    ? "bg-rose-500 text-white shadow-rose-200 animate-pulse"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-slate-100"
            )}
            title={listening ? "Stop Listening" : "Start Voice Command"}
        >
            {listening ? (
                <div className="flex gap-1">
                    <motion.span
                        animate={{ height: [8, 16, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className="w-1 bg-white rounded-full"
                    />
                    <motion.span
                        animate={{ height: [12, 8, 12] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                        className="w-1 bg-white rounded-full"
                    />
                    <motion.span
                        animate={{ height: [8, 16, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                        className="w-1 bg-white rounded-full"
                    />
                </div>
            ) : (
                <Mic size={20} />
            )}
        </motion.button>
    );
}

const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(" ");
};
