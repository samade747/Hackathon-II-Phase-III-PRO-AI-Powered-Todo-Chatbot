"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import "regenerator-runtime/runtime";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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

    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) return;
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
        }
    };

    return (
        <motion.button
            whileHover={browserSupportsSpeechRecognition ? { scale: 1.05 } : {}}
            whileTap={browserSupportsSpeechRecognition ? { scale: 0.95 } : {}}
            onClick={toggleListening}
            className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md",
                // Show always, but style differently if not supported
                !browserSupportsSpeechRecognition
                    ? "bg-slate-100 text-slate-400 border border-slate-200 opacity-80"
                    : listening
                        ? "bg-rose-500 text-white shadow-rose-200 animate-pulse active:scale-95"
                        : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm active:scale-95"
            )}
            title={!browserSupportsSpeechRecognition ? "Voice input not supported in this browser" : listening ? "Stop Listening" : "Start Voice Command"}
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


